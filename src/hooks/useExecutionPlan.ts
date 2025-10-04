import { useState, useCallback } from 'react';
import { ExecutionPlan } from '../services/ai/executionPlanner';
import { supabase } from '../lib/supabase';

interface UsePlanManagementReturn {
  plans: ExecutionPlan[];
  currentPlan: ExecutionPlan | null;
  loading: boolean;
  error: string | null;
  createPlan: (plan: ExecutionPlan) => Promise<void>;
  updatePlan: (planId: string, updates: Partial<ExecutionPlan>) => Promise<void>;
  approvePlan: (planId: string) => Promise<void>;
  rejectPlan: (planId: string, reason?: string) => Promise<void>;
  executePlan: (planId: string) => Promise<void>;
  rollbackPlan: (planId: string) => Promise<void>;
  getPlan: (planId: string) => Promise<ExecutionPlan | null>;
  listPlans: (sessionId: string) => Promise<void>;
}

export function useExecutionPlan(sessionId: string): UsePlanManagementReturn {
  const [plans, setPlans] = useState<ExecutionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<ExecutionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPlan = useCallback(async (plan: ExecutionPlan) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('execution_plans')
        .insert({
          session_id: sessionId,
          plan_id: plan.id,
          title: plan.title,
          description: plan.description,
          operations: plan.operations,
          estimated_duration: plan.estimatedDuration,
          risks: plan.risks,
          prerequisites: plan.prerequisites,
          success_criteria: plan.successCriteria,
          rollback_strategy: plan.rollbackStrategy,
          status: plan.status,
          created_at: plan.createdAt
        })
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      setPlans(prev => [...prev, plan]);
      setCurrentPlan(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plan');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const updatePlan = useCallback(async (planId: string, updates: Partial<ExecutionPlan>) => {
    setLoading(true);
    setError(null);

    try {
      const { error: supabaseError } = await supabase
        .from('execution_plans')
        .update({
          title: updates.title,
          description: updates.description,
          operations: updates.operations,
          estimated_duration: updates.estimatedDuration,
          risks: updates.risks,
          prerequisites: updates.prerequisites,
          success_criteria: updates.successCriteria,
          rollback_strategy: updates.rollbackStrategy,
          status: updates.status,
          updated_at: new Date().toISOString()
        })
        .eq('plan_id', planId);

      if (supabaseError) throw supabaseError;

      setPlans(prev => prev.map(p =>
        p.id === planId ? { ...p, ...updates } : p
      ));

      if (currentPlan?.id === planId) {
        setCurrentPlan(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plan');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentPlan]);

  const approvePlan = useCallback(async (planId: string) => {
    await updatePlan(planId, { status: 'approved' });

    await supabase
      .from('plan_approvals')
      .insert({
        plan_id: planId,
        session_id: sessionId,
        approved_by: 'user',
        approved_at: new Date().toISOString()
      });
  }, [sessionId, updatePlan]);

  const rejectPlan = useCallback(async (planId: string, reason?: string) => {
    await updatePlan(planId, { status: 'rejected' });

    await supabase
      .from('plan_approvals')
      .insert({
        plan_id: planId,
        session_id: sessionId,
        approved_by: 'user',
        rejection_reason: reason,
        approved_at: new Date().toISOString()
      });
  }, [sessionId, updatePlan]);

  const executePlan = useCallback(async (planId: string) => {
    await updatePlan(planId, { status: 'executing' });
  }, [updatePlan]);

  const rollbackPlan = useCallback(async (planId: string) => {
    await updatePlan(planId, { status: 'rolled_back' });
  }, [updatePlan]);

  const getPlan = useCallback(async (planId: string): Promise<ExecutionPlan | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('execution_plans')
        .select('*')
        .eq('plan_id', planId)
        .single();

      if (supabaseError) throw supabaseError;

      const plan: ExecutionPlan = {
        id: data.plan_id,
        title: data.title,
        description: data.description,
        operations: data.operations,
        estimatedDuration: data.estimated_duration,
        risks: data.risks,
        prerequisites: data.prerequisites,
        successCriteria: data.success_criteria,
        rollbackStrategy: data.rollback_strategy,
        status: data.status,
        createdAt: data.created_at
      };

      setCurrentPlan(plan);
      return plan;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get plan');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const listPlans = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('execution_plans')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      const plansList: ExecutionPlan[] = (data || []).map(item => ({
        id: item.plan_id,
        title: item.title,
        description: item.description,
        operations: item.operations,
        estimatedDuration: item.estimated_duration,
        risks: item.risks,
        prerequisites: item.prerequisites,
        successCriteria: item.success_criteria,
        rollbackStrategy: item.rollback_strategy,
        status: item.status,
        createdAt: item.created_at
      }));

      setPlans(plansList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list plans');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    plans,
    currentPlan,
    loading,
    error,
    createPlan,
    updatePlan,
    approvePlan,
    rejectPlan,
    executePlan,
    rollbackPlan,
    getPlan,
    listPlans
  };
}
