$body = @{
    title = "Test Event"
    description = "Test"
    date = "2024-04-10"
    time = "20:00"
    leaderId = "184485021719986176"  # User's Discord ID
    size = 25
    roles = @{
        tank = 2
        healer = 5
        dps = 18
    }
} | ConvertTo-Json

Invoke-WebRequest -Method POST `
    -Uri "http://localhost:8888/.netlify/functions/raidhelper" `
    -ContentType "application/json" `
    -Body $body 