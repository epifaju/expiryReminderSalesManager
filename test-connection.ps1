$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

Write-Host "Testing localhost connection..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/auth/signin" -Method Post -ContentType "application/json" -Body $body
    Write-Host "Localhost SUCCESS: $($response | ConvertTo-Json)"
} catch {
    Write-Host "Localhost ERROR: $($_.Exception.Message)"
}

Write-Host "`nTesting IP address connection..."
try {
    $response = Invoke-RestMethod -Uri "http://192.168.1.27:8081/auth/signin" -Method Post -ContentType "application/json" -Body $body
    Write-Host "IP Address SUCCESS: $($response | ConvertTo-Json)"
} catch {
    Write-Host "IP Address ERROR: $($_.Exception.Message)"
}

Write-Host "`nTesting Android emulator address..."
try {
    $response = Invoke-RestMethod -Uri "http://10.0.2.2:8081/auth/signin" -Method Post -ContentType "application/json" -Body $body
    Write-Host "Android Emulator SUCCESS: $($response | ConvertTo-Json)"
} catch {
    Write-Host "Android Emulator ERROR: $($_.Exception.Message)"
}
