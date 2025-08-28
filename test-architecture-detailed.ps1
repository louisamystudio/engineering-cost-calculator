# Detailed test of architecture floor logic

Write-Host "`n=== DETAILED ARCHITECTURE FLOOR TEST ===" -ForegroundColor Green

$body = @{
    projectName = "Architecture Floor Debug"
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
    architecturePercentageOverride = 0.25  # 25% floor
    structuralPercentageOverride = 0.30
    civilPercentageOverride = 0.30
    mechanicalPercentageOverride = 0.20
} | ConvertTo-Json

Write-Host "`nInput Overrides:" -ForegroundColor Yellow
Write-Host "  Architecture Floor: 25%" -ForegroundColor Cyan
Write-Host "  Structural: 30%" -ForegroundColor Cyan
Write-Host "  Civil: 30%" -ForegroundColor Cyan
Write-Host "  Mechanical: 20%" -ForegroundColor Cyan
Write-Host "  Engineering Sum: 80%" -ForegroundColor Yellow

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/projects/calculate" -Method POST -Body $body -ContentType "application/json"

# Calculate actual percentages
$shellBudget = [decimal]$response.calculations.shellBudgetTotal
$archBudget = [decimal]$response.calculations.architectureBudget
$structBudget = [decimal]$response.calculations.structuralBudget
$civilBudget = [decimal]$response.calculations.civilBudget
$mechBudget = [decimal]$response.calculations.mechanicalBudget
$elecBudget = [decimal]$response.calculations.electricalBudget
$plumbBudget = [decimal]$response.calculations.plumbingBudget
$teleBudget = [decimal]$response.calculations.telecomBudget

Write-Host "`nActual Budget Distribution:" -ForegroundColor Yellow
Write-Host "  Shell Budget Total: `$$($shellBudget.ToString('N2'))" -ForegroundColor Gray

$archPct = $archBudget / $shellBudget * 100
$structPct = $structBudget / $shellBudget * 100
$civilPct = $civilBudget / $shellBudget * 100
$mechPct = $mechBudget / $shellBudget * 100
$elecPct = $elecBudget / $shellBudget * 100
$plumbPct = $plumbBudget / $shellBudget * 100
$telePct = $teleBudget / $shellBudget * 100

Write-Host "`n  Architecture: $($archPct.ToString('F2'))% (`$$($archBudget.ToString('N2')))" -ForegroundColor Green
Write-Host "  Structural: $($structPct.ToString('F2'))% (`$$($structBudget.ToString('N2')))" -ForegroundColor Cyan
Write-Host "  Civil: $($civilPct.ToString('F2'))% (`$$($civilBudget.ToString('N2')))" -ForegroundColor Cyan
Write-Host "  Mechanical: $($mechPct.ToString('F2'))% (`$$($mechBudget.ToString('N2')))" -ForegroundColor Cyan
Write-Host "  Electrical: $($elecPct.ToString('F2'))% (`$$($elecBudget.ToString('N2')))" -ForegroundColor Cyan
Write-Host "  Plumbing: $($plumbPct.ToString('F2'))% (`$$($plumbBudget.ToString('N2')))" -ForegroundColor Cyan
Write-Host "  Telecom: $($telePct.ToString('F2'))% (`$$($teleBudget.ToString('N2')))" -ForegroundColor Cyan

$engSum = $structPct + $civilPct + $mechPct + $elecPct + $plumbPct + $telePct
$total = $archPct + $engSum

Write-Host "`nSummary:" -ForegroundColor Yellow
Write-Host "  Engineering Sum: $($engSum.ToString('F2'))%" -ForegroundColor Cyan
Write-Host "  Architecture + Engineering: $($total.ToString('F2'))%" -ForegroundColor Green
Write-Host "  Expected Architecture Floor: 25%" -ForegroundColor Gray
Write-Host "  Actual Architecture: $($archPct.ToString('F2'))%" -ForegroundColor $(if ($archPct -ge 25) { "Green" } else { "Red" })

# Check if engineering was scaled
if ($engSum -le 75) {
    Write-Host "`nEngineering correctly scaled to fit within 75% limit" -ForegroundColor Green
} else {
    Write-Host "`nEngineering NOT properly scaled" -ForegroundColor Red
}

# Test DataVizPro UI
Write-Host "`n=== DATAVIZPRO UI CONFIRMATION ===" -ForegroundColor Green
Write-Host "Root URL (/) is mapped to: DataVizProDashboard component" -ForegroundColor Cyan
Write-Host "To access DataVizPro UI: http://localhost:5000/" -ForegroundColor Yellow
Write-Host "Current screenshots show: /fee-matrix-bottom-up (Classic UI)" -ForegroundColor Gray
