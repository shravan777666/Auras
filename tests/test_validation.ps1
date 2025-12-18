$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "=== Testing Invalid Email ==="
$body1 = @{
    email = "invalid-email"
    userType = "customer"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/forgot-password/request-reset" -Method POST -Headers $headers -Body $body1
    Write-Host "Success Response:"
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error Response:"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response Body: $responseBody"
}

Write-Host "`n=== Testing Missing Fields ==="
$body2 = @{
    email = "test@example.com"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/forgot-password/request-reset" -Method POST -Headers $headers -Body $body2
    Write-Host "Success Response:"
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error Response:"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response Body: $responseBody"
}

Write-Host "`n=== Testing Invalid User Type ==="
$body3 = @{
    email = "test@example.com"
    userType = "invalid"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/forgot-password/request-reset" -Method POST -Headers $headers -Body $body3
    Write-Host "Success Response:"
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error Response:"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response Body: $responseBody"
}