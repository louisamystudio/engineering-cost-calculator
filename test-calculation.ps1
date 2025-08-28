# Test calculation matching Excel example
$body = @{
    projectName = "Excel Validation Test"
    buildingUse = "Residential"
    buildingType = "Custom Houses"
    buildingTier = "Mid"
    designLevel = 3
    category = 5
    newBuildingArea = 2000
    existingBuildingArea = 2000
    siteArea = 972
    historicMultiplier = 1.0
    remodelMultiplier = 0.5
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/projects/calculate" -Method POST -Body $body -ContentType "application/json"

Write-Host "`n=== CALCULATION VALIDATION RESULTS ===" -ForegroundColor Green
Write-Host "`nBudget Calculations:" -ForegroundColor Yellow
Write-Host "  New Construction Budget: $($response.calculations.newBudget)"
Write-Host "  Remodel Budget: $($response.calculations.remodelBudget)"
Write-Host "  Total Budget: $($response.calculations.totalBudget)"

Write-Host "`nShare Percentages:" -ForegroundColor Yellow
Write-Host "  Architecture Share: $($response.calculations.architectureShare)"
Write-Host "  Shell Share: $($response.calculations.shellShare)"
Write-Host "  Interior Share: $($response.calculations.interiorShare)"
Write-Host "  Landscape Share: $($response.calculations.landscapeShare)"

Write-Host "`nArchitecture Budget:" -ForegroundColor Yellow
Write-Host "  Total: $($response.calculations.architectureBudget)"

Write-Host "`nEngineering Percentages:" -ForegroundColor Yellow
Write-Host "  Structural: $($response.calculations.structuralShare)"
Write-Host "  Civil: $($response.calculations.civilShare)"

Write-Host "`nHours Calculations:" -ForegroundColor Yellow
$hoursData = $response.hours | Where-Object {$_.phase -eq "Total"}
Write-Host "  Total Hours: $($hoursData.totalHours)"

Write-Host "`nFee Calculations:" -ForegroundColor Yellow
$archFee = $response.fees | Where-Object {$_.scope -eq "Architecture (Design + Consultant Admin.)"}
Write-Host "  Architecture Market Fee: $($archFee.marketFee)"
Write-Host "  Architecture Fee %: $($archFee.percentOfCost)"
