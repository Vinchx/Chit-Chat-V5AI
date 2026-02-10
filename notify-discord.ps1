# Discord Webhook Notifier - Enhanced Version with Embed
# Sends beautiful Discord notifications for local Git commits

param(
    [string]$CustomMessage = ""
)

$WEBHOOK_URL = "https://discord.com/api/webhooks/1470821029114023991/BxlIfGF4ICkleiO5-__3yvR2HLJv3NXb_L6-as8DunPo5sHoWVGacCA3Jucf3X4aXTQD"

# Get commit info
try {
    $hash = (git rev-parse --short HEAD 2>$null) -join "" | ForEach-Object { $_.Trim() }
    $msg = ((git log -1 --pretty=%B 2>$null) -join " ") | ForEach-Object { $_.Trim() } | ForEach-Object { $_ -replace '"', '\"' }
    $author = (git log -1 --pretty=%an 2>$null) -join "" | ForEach-Object { $_.Trim() }
    $branch = (git branch --show-current 2>$null) -join "" | ForEach-Object { $_.Trim() }
    $repo = Split-Path -Leaf (git rev-parse --show-toplevel 2>$null)
    $timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.000Z")

    
    if (-not $hash) {
        throw "Not in a git repository"
    }
    
    # Create embed payload using hashtable
    $embed = @{
        title = "LOCAL COMMIT - $repo"
        description = $msg
        color = 3447003
        fields = @(
            @{
                name = "Author"
                value = $author
                inline = $true
            }
            @{
                name = "Branch"
                value = $branch
                inline = $true
            }
            @{
                name = "Commit"
                value = $hash
                inline = $true
            }
        )
        footer = @{
            text = "Local Development"
        }
        timestamp = $timestamp
    }

    
    $body = @{
        embeds = @($embed)
    }
    
    $payload = $body | ConvertTo-Json -Depth 10 -Compress
    
} catch {
    # Fallback: simple message
    $fallbackMsg = if ($CustomMessage) { $CustomMessage } else { "Test notification from Git" }
    $payload = @{
        content = $fallbackMsg
    } | ConvertTo-Json -Compress
}

# Send to Discord
try {
    Invoke-RestMethod -Uri $WEBHOOK_URL -Method Post -ContentType "application/json; charset=utf-8" -Body $payload | Out-Null
    Write-Host "[OK] Discord notification sent!" -ForegroundColor Green
    exit 0
} catch {
    Write-Host "[ERROR] Failed to send notification" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}


