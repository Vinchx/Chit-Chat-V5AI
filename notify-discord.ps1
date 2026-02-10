# Discord Webhook Notifier - Simple Version
# Usage: .\notify-discord.ps1 "Your message here"

param(
    [string]$Message = "Test notification from Git"
)

$WEBHOOK_URL = "https://discord.com/api/webhooks/1470821029114023991/BxlIfGF4ICkleiO5-__3yvR2HLJv3NXb_L6-as8DunPo5sHoWVGacCA3Jucf3X4aXTQD"

# Get commit info if in git repo
try {
    $hash = git rev-parse --short HEAD 2>$null
    $msg = git log -1 --pretty=%B 2>$null
    $author = git log -1 --pretty=%an 2>$null
    $branch = git branch --show-current 2>$null
    
    if ($hash) {
        $Message = "**New Commit!**`n`n**Message:** $msg`n**Author:** $author`n**Branch:** $branch`n**Commit:** ``$hash``"
    }
} catch {
    # Not in git repo, use provided message
}

# Create payload
$payload = @{
    content = $Message
} | ConvertTo-Json

# Send to Discord
try {
    $response = Invoke-RestMethod -Uri $WEBHOOK_URL -Method Post -ContentType "application/json; charset=utf-8" -Body $payload
    Write-Host "[OK] Discord notification sent!" -ForegroundColor Green
    exit 0
} catch {
    Write-Host "[ERROR] Failed to send notification" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

