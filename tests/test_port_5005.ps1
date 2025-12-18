$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    email = "test@example.com"
    userType = "customer"
} | ConvertTo-Json

try {
    Write-Host "Testing forgot password endpoint on port 5005..."
    Write-Host "URL: http://localhost:5005/api/forgot-password/request-reset"
    Write-Host "Body: $body"
    
    $response = Invoke-RestMethod -Uri "http://localhost:5005/api/forgot-password/request-reset" -Method POST -Headers $headers -Body $body
    
    Write-Host "Success Response:"
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error Response:"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Status Description: $($_.Exception.Response.StatusDescription)"
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}