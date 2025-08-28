# Test Architecture Floor and Engineering Scaling

Write-Host "`n=== TEST 1: High Engineering Percentages (Should Scale Down) ===" -ForegroundColor Yellow

# Test with engineering percentages that would normally exceed 90%
$body = @{
    projectName = "High Engineering Test"
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
    # Override engineering percentages to sum > 90%
    structuralPercentageOverride = 0.25
    civilPercentageOverride = 0.20
    mechanicalPercentageOverride = 0.20
    electricalPercentageOverride = 0.20
    plumbingPercentageOverride = 0.15
    telecomPercentageOverride = 0.10
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/projects/calculate" -Method POST -Body $body -ContentType "application/json"

Write-Host "Engineering Overrides Sum: " -NoNewline
$engSum = 0.25 + 0.20 + 0.20 + 0.20 + 0.15 + 0.10
Write-Host "$($engSum * 100)%" -ForegroundColor Red

Write-Host "`nActual Engineering Budgets (should be scaled):"
$shellBudget = [decimal]$response.calculations.shellBudgetTotal
$structPct = [decimal]$response.calculations.structuralBudget / $shellBudget
$civilPct = [decimal]$response.calculations.civilBudget / $shellBudget
$mechPct = [decimal]$response.calculations.mechanicalBudget / $shellBudget
$elecPct = [decimal]$response.calculations.electricalBudget / $shellBudget
$plumbPct = [decimal]$response.calculations.plumbingBudget / $shellBudget
$telePct = [decimal]$response.calculations.telecomBudget / $shellBudget
$archPct = [decimal]$response.calculations.architectureBudget / $shellBudget

Write-Host "  Structural: $($structPct.ToString('P2'))" -ForegroundColor Cyan
Write-Host "  Civil: $($civilPct.ToString('P2'))" -ForegroundColor Cyan
Write-Host "  Mechanical: $($mechPct.ToString('P2'))" -ForegroundColor Cyan
Write-Host "  Electrical: $($elecPct.ToString('P2'))" -ForegroundColor Cyan
Write-Host "  Plumbing: $($plumbPct.ToString('P2'))" -ForegroundColor Cyan
Write-Host "  Telecom: $($telePct.ToString('P2'))" -ForegroundColor Cyan
Write-Host "  Architecture: $($archPct.ToString('P2'))" -ForegroundColor Green

$actualEngSum = $structPct + $civilPct + $mechPct + $elecPct + $plumbPct + $telePct
Write-Host "`nEngineering Sum (scaled): $($actualEngSum.ToString('P2'))" -ForegroundColor Yellow
Write-Host "Architecture + Engineering: $(($archPct + $actualEngSum).ToString('P2'))" -ForegroundColor Yellow

Write-Host "`n=== TEST 2: Custom Architecture Floor ===" -ForegroundColor Yellow

# Test with custom architecture floor
$body2 = @{
    projectName = "Custom Arch Floor Test"
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
    architecturePercentageOverride = 0.20  # 20% floor
    structuralPercentageOverride = 0.50
    civilPercentageOverride = 0.40
} | ConvertTo-Json

$response2 = Invoke-RestMethod -Uri "http://localhost:5000/api/projects/calculate" -Method POST -Body $body2 -ContentType "application/json"

$shellBudget2 = [decimal]$response2.calculations.shellBudgetTotal
$archPct2 = [decimal]$response2.calculations.architectureBudget / $shellBudget2

Write-Host "`nWith 20% Architecture Floor:"
Write-Host "  Architecture: $($archPct2.ToString('P2'))" -ForegroundColor Green
Write-Host "  Should be >= 20%" -ForegroundColor Gray

Write-Host "`n=== TEST 3: Division by Zero Protection ===" -ForegroundColor Yellow

# Test with zero pricing rate
$body3 = @{
    projectName = "Zero Rate Test"
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
    scanToBimEnabled = $true
} | ConvertTo-Json

$response3 = Invoke-RestMethod -Uri "http://localhost:5000/api/projects/calculate" -Method POST -Body $body3 -ContentType "application/json"

$scanFee = $response3.fees | Where-Object { $_.scope -eq "Scan to Bim - Building" }
if ($scanFee) {
    Write-Host "`nScan to BIM Hours: $($scanFee.hours)" -ForegroundColor Cyan
    Write-Host "  Should be numeric (not NaN or error)" -ForegroundColor Gray
}

Write-Host "`n=== ALL TESTS COMPLETE ===" -ForegroundColor Green
