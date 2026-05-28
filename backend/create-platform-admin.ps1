param(
  [string]$BaseUrl = "http://localhost:8082",
  [string]$Username = "platformadmin1",
  [string]$Email = "platformadmin1@test.local",
  [string]$Password = "password"
)

$ErrorActionPreference = "Stop"

$body = @{
  username = $Username
  email    = $Email
  password = $Password
  roles    = @("ROLE_PLATFORM_ADMIN")
} | ConvertTo-Json

Write-Host ("Creating platform admin '{0}' on {1} ..." -f $Username, $BaseUrl)

try {
  Invoke-RestMethod -Method Post -Uri "$BaseUrl/auth/signup" -ContentType "application/json" -Body $body | Out-Null
  Write-Host ("Created: {0} (ROLE_PLATFORM_ADMIN)" -f $Username)
} catch {
  $status = $null
  try { $status = $_.Exception.Response.StatusCode.value__ } catch {}

  if ($status -eq 409) {
    Write-Host ("Already exists: {0}" -f $Username)
    exit 0
  }

  Write-Host ("Failed: {0}" -f $Username)
  throw
}

Write-Host ("Done. Password is: {0}" -f $Password)

