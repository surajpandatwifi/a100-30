import { FileQuestion, FileCode } from 'lucide-react';

interface FileViewerProps {
  filePath: string | null;
}

const mockFileContents: Record<string, string> = {
  'Assets/Scripts/PlayerController.cs': `using UnityEngine;

public class PlayerController : MonoBehaviour
{
    [SerializeField] private float moveSpeed = 5f;
    [SerializeField] private float jumpForce = 10f;

    private Rigidbody2D rb;
    private bool isGrounded;

    private void Start()
    {
        rb = GetComponent<Rigidbody2D>();
    }

    private void Update()
    {
        HandleMovement();
        HandleJump();
    }

    private void HandleMovement()
    {
        float horizontalInput = Input.GetAxisRaw("Horizontal");
        rb.velocity = new Vector2(horizontalInput * moveSpeed, rb.velocity.y);
    }

    private void HandleJump()
    {
        if (Input.GetKeyDown(KeyCode.Space) && isGrounded)
        {
            rb.AddForce(Vector2.up * jumpForce, ForceMode2D.Impulse);
        }
    }
}`,
  'Assets/Scripts/GameManager.cs': `using UnityEngine;
using UnityEngine.SceneManagement;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [SerializeField] private int currentLevel = 1;
    [SerializeField] private int playerLives = 3;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void LoadNextLevel()
    {
        currentLevel++;
        SceneManager.LoadScene($"Level{currentLevel}");
    }

    public void PlayerDied()
    {
        playerLives--;
        if (playerLives <= 0)
        {
            GameOver();
        }
    }

    private void GameOver()
    {
        SceneManager.LoadScene("GameOver");
    }
}`,
  'Assets/Scripts/EnemyAI.cs': `using UnityEngine;

public class EnemyAI : MonoBehaviour
{
    [SerializeField] private float moveSpeed = 3f;
    [SerializeField] private float detectionRange = 5f;
    [SerializeField] private Transform player;

    private void Update()
    {
        if (player == null) return;

        float distanceToPlayer = Vector2.Distance(transform.position, player.position);

        if (distanceToPlayer < detectionRange)
        {
            ChasePlayer();
        }
    }

    private void ChasePlayer()
    {
        Vector2 direction = (player.position - transform.position).normalized;
        transform.position = Vector2.MoveTowards(
            transform.position,
            player.position,
            moveSpeed * Time.deltaTime
        );
    }
}`,
};

export default function FileViewer({ filePath }: FileViewerProps) {
  if (!filePath) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-center space-y-3">
          <FileQuestion className="w-12 h-12 text-gray-600 mx-auto" />
          <p className="text-sm text-gray-400">Select a file to preview</p>
        </div>
      </div>
    );
  }

  const content = mockFileContents[filePath];

  if (!content) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-center space-y-3">
          <FileQuestion className="w-12 h-12 text-gray-600 mx-auto" />
          <p className="text-sm text-gray-400">File content not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="h-10 border-b border-[#2F4F4F] flex items-center px-4 bg-[#36454F]">
        <FileCode className="w-4 h-4 text-white mr-2" />
        <span className="text-sm text-white font-mono">{filePath}</span>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-sm text-gray-200 font-mono leading-relaxed">
          <code>{content}</code>
        </pre>
      </div>
    </div>
  );
}
