<?php
/**
 * Benjamin Reuland - Endpoint Formulaire Contact
 * PHP 8+ - reCAPTCHA v3 - Rate Limit - SMTP - Backups JSON
 */

declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

$allowed_origins = ['https://benjamin-reuland.be', 'https://www.benjamin-reuland.be'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: https://benjamin-reuland.be');
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

class Config {
    public static function get(string $key, string $default = ''): string {
        return getenv($key) ?: $default;
    }
}

const STORAGE_PATH = __DIR__ . '/../storage/forms/';
const RATE_LIMIT_FILE = __DIR__ . '/../storage/.rate_limits';

$recaptcha_secret = Config::get('RECAPTCHA_SECRET_KEY');
$mail_to = Config::get('MAIL_TO', 'contact@benjamin-reuland.be');
$mail_from = Config::get('MAIL_FROM', 'no-reply@benjamin-reuland.be');

if (empty($recaptcha_secret)) {
    error_log('RECAPTCHA_SECRET_KEY non configuré');
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Configuration incomplète']);
    exit;
}

class RateLimiter {
    private string $file;

    public function __construct(string $file) {
        $this->file = $file;
        $dir = dirname($file);
        if (!is_dir($dir)) mkdir($dir, 0750, true);
    }

    public function isAllowed(string $ip): bool {
        $data = $this->loadData();
        $now = time();

        $data = array_filter($data, function($timestamps) use ($now) {
            return max($timestamps) > ($now - 600);
        });

        if (!isset($data[$ip])) $data[$ip] = [];

        $last_minute = array_filter($data[$ip], function($timestamp) use ($now) {
            return $timestamp > ($now - 60);
        });

        $last_10_minutes = array_filter($data[$ip], function($timestamp) use ($now) {
            return $timestamp > ($now - 600);
        });

        if (count($last_minute) >= 2 || count($last_10_minutes) >= 5) {
            return false;
        }

        $data[$ip][] = $now;
        $this->saveData($data);
        return true;
    }

    private function loadData(): array {
        if (!file_exists($this->file)) return [];
        $content = file_get_contents($this->file);
        $data = json_decode($content, true);
        return is_array($data) ? $data : [];
    }

    private function saveData(array $data): void {
        file_put_contents($this->file, json_encode($data), LOCK_EX);
    }
}

class FormBackup {
    private string $storage_path;

    public function __construct(string $storage_path) {
        $this->storage_path = rtrim($storage_path, '/') . '/';
        if (!is_dir($this->storage_path)) {
            mkdir($this->storage_path, 0750, true);
        }

        $htaccess = $this->storage_path . '.htaccess';
        if (!file_exists($htaccess)) {
            file_put_contents($htaccess, 
                "Order Deny,Allow\nDeny from all\n<Files \"*.json\">\n    Header set X-Robots-Tag \"noindex, nofollow\"\n</Files>\n"
            );
        }
    }

    public function save(array $data): string {
        $date = date('Y-m');
        $month_dir = $this->storage_path . $date . '/';
        if (!is_dir($month_dir)) mkdir($month_dir, 0750, true);

        $id = uniqid('form_', true);
        $filename = $month_dir . $id . '.json';

        $backup_data = [
            'id' => $id,
            'timestamp' => time(),
            'date' => date('c'),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'data' => $data
        ];

        file_put_contents($filename, json_encode($backup_data, JSON_PRETTY_PRINT), LOCK_EX);
        $this->purgeOldFiles();
        return $id;
    }

    private function purgeOldFiles(): void {
        $cutoff = time() - (90 * 24 * 60 * 60);
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($this->storage_path)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'json') {
                if ($file->getMTime() < $cutoff) {
                    unlink($file->getPathname());
                }
            }
        }
    }
}

function validateInput(): array {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) throw new InvalidArgumentException('Données JSON invalides');

    $required_fields = ['name', 'email', 'message', 'token'];
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            throw new InvalidArgumentException("Champ requis manquant: $field");
        }
    }

    if (!empty($input['website'])) {
        throw new InvalidArgumentException('Spam détecté');
    }

    $email = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
    if (!$email) throw new InvalidArgumentException('Adresse email invalide');

    $message = trim($input['message']);
    if (strlen($message) < 100) {
        throw new InvalidArgumentException('Le message doit contenir au moins 100 caractères');
    }

    return [
        'name' => htmlspecialchars(trim($input['name']), ENT_QUOTES, 'UTF-8'),
        'email' => $email,
        'message' => $message,
        'token' => $input['token'],
        'consent' => !empty($input['consent']),
        'language' => $input['language'] ?? 'fr'
    ];
}

function verifyRecaptcha(string $token, string $secret): bool {
    $url = 'https://www.google.com/recaptcha/api/siteverify';
    $data = [
        'secret' => $secret,
        'response' => $token,
        'remoteip' => $_SERVER['REMOTE_ADDR'] ?? ''
    ];

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-type: application/x-www-form-urlencoded',
            'content' => http_build_query($data),
            'timeout' => 5
        ]
    ]);

    $response = @file_get_contents($url, false, $context);
    if (!$response) return false;

    $result = json_decode($response, true);
    if (!$result || !$result['success']) return false;

    $score_threshold = 0.5;
    if (isset($result['score']) && $result['score'] < $score_threshold) {
        return false;
    }

    return true;
}

function sendEmail(array $data, string $to, string $from): bool {
    $subject = "Nouveau message de {$data['name']} - benjamin-reuland.be";

    $message = "Nouveau message reçu depuis benjamin-reuland.be\n\n";
    $message .= "Nom: {$data['name']}\n";
    $message .= "Email: {$data['email']}\n";
    $message .= "Date: " . date('d/m/Y à H:i') . "\n";
    $message .= "Langue: {$data['language']}\n\n";
    $message .= "Message:\n";
    $message .= wordwrap($data['message'], 70) . "\n\n";
    $message .= "---\n";
    $message .= "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'inconnue') . "\n";

    $headers = [
        'From' => $from,
        'Reply-To' => $data['email'],
        'Content-Type' => 'text/plain; charset=UTF-8',
        'X-Mailer' => 'PHP/' . phpversion()
    ];

    $headers_string = '';
    foreach ($headers as $key => $value) {
        $headers_string .= "$key: $value\r\n";
    }

    return mail($to, $subject, $message, $headers_string);
}

function sendAcknowledgment(array $data): bool {
    $subjects = [
        'fr' => 'Merci pour votre message - Benjamin Reuland',
        'en' => 'Thank you for your message - Benjamin Reuland',
        'nl' => 'Bedankt voor uw bericht - Benjamin Reuland',
        'de' => 'Vielen Dank für Ihre Nachricht - Benjamin Reuland',
        'sv' => 'Tack för ditt meddelande - Benjamin Reuland'
    ];

    $messages = [
        'fr' => "Bonjour {$data['name']},\n\nMerci pour votre message. Je vous répondrai dans les plus brefs délais.\n\nCordialement,\nBenjamin Reuland",
        'en' => "Hello {$data['name']},\n\nThank you for your message. I will get back to you as soon as possible.\n\nBest regards,\nBenjamin Reuland",
        'nl' => "Hallo {$data['name']},\n\nBedankt voor uw bericht. Ik zal zo snel mogelijk bij u terugkomen.\n\nMet vriendelijke groeten,\nBenjamin Reuland",
        'de' => "Hallo {$data['name']},\n\nVielen Dank für Ihre Nachricht. Ich werde Ihnen so schnell wie möglich antworten.\n\nMit freundlichen Grüßen,\nBenjamin Reuland",
        'sv' => "Hej {$data['name']},\n\nTack för ditt meddelande. Jag återkommer till dig så snart som möjligt.\n\nMed vänliga hälsningar,\nBenjamin Reuland"
    ];

    $lang = $data['language'] ?? 'fr';
    $subject = $subjects[$lang] ?? $subjects['fr'];
    $message = $messages[$lang] ?? $messages['fr'];

    $headers = [
        'From' => Config::get('MAIL_FROM', 'no-reply@benjamin-reuland.be'),
        'Reply-To' => Config::get('MAIL_TO', 'contact@benjamin-reuland.be'),
        'Content-Type' => 'text/plain; charset=UTF-8'
    ];

    $headers_string = '';
    foreach ($headers as $key => $value) {
        $headers_string .= "$key: $value\r\n";
    }

    return mail($data['email'], $subject, $message, $headers_string);
}

try {
    $rate_limiter = new RateLimiter(RATE_LIMIT_FILE);
    $client_ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

    if (!$rate_limiter->isAllowed($client_ip)) {
        http_response_code(429);
        echo json_encode([
            'ok' => false, 
            'error' => 'Trop de requêtes. Veuillez patienter.',
            'retry_after' => 60
        ]);
        exit;
    }

    $data = validateInput();

    if (!verifyRecaptcha($data['token'], $recaptcha_secret)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Vérification anti-spam échouée']);
        exit;
    }

    $backup = new FormBackup(STORAGE_PATH);
    $backup_id = $backup->save($data);

    $sent_owner = sendEmail($data, $mail_to, $mail_from);
    $sent_ack = sendAcknowledgment($data);

    if (!$sent_owner) error_log('Erreur envoi email propriétaire');
    if (!$sent_ack) error_log('Erreur envoi accusé de réception');

    http_response_code(200);
    echo json_encode([
        'ok' => true,
        'id' => $backup_id,
        'sent_owner' => $sent_owner,
        'sent_ack' => $sent_ack,
        'message' => 'Message envoyé avec succès'
    ]);

} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);

} catch (Exception $e) {
    error_log('Erreur formulaire: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Erreur interne du serveur']);
}
?>