param(
  [string]$BaseUrl = "http://localhost:8082",
  [string]$Password = "password"
)

$ErrorActionPreference = "Stop"

function Ensure-User {
  param(
    [Parameter(Mandatory=$true)][string]$Username,
    [Parameter(Mandatory=$true)][string]$Email,
    [Parameter(Mandatory=$true)][string[]]$Roles
  )

  $body = @{
    username = $Username
    email    = $Email
    password = $Password
    roles    = $Roles
  } | ConvertTo-Json

  try {
    Invoke-RestMethod -Method Post -Uri "$BaseUrl/auth/signup" -ContentType "application/json" -Body $body | Out-Null
    Write-Host ("Created: {0} ({1})" -f $Username, ($Roles -join ','))
  } catch {
    $status = $null
    try { $status = $_.Exception.Response.StatusCode.value__ } catch {}

    if ($status -eq 409) {
      Write-Host ("Already exists: {0}" -f $Username)
      return
    }

    Write-Host ("Failed: {0}" -f $Username)
    throw
  }
}

Write-Host ("Seeding test users into {0} ..." -f $BaseUrl)

Ensure-User -Username "manager1" -Email "manager1@test.local" -Roles @("ROLE_MANAGER")
Ensure-User -Username "manager2" -Email "manager2@test.local" -Roles @("ROLE_MANAGER")
Ensure-User -Username "user1"    -Email "user1@test.local"    -Roles @("ROLE_USER")
Ensure-User -Username "user2"    -Email "user2@test.local"    -Roles @("ROLE_USER")
Ensure-User -Username "user3"    -Email "user3@test.local"    -Roles @("ROLE_USER")
Ensure-User -Username "platformadmin1" -Email "platformadmin1@test.local" -Roles @("ROLE_PLATFORM_ADMIN")

Write-Host ("Done. Password for all accounts is: {0}" -f $Password)

