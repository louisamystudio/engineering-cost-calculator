# Comprehensive calculation validation against Excel formulas
$body = @{
    projectName = "Excel Formula Validation"
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

Write-Host "Sending calculation request..." -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/projects/calculate" -Method POST -Body $body -ContentType "application/json"

Write-Host "`n====== EXCEL VS APP CALCULATION COMPARISON ======" -ForegroundColor Green

# Budget calculations
Write-Host "`n1. BUDGET CALCULATIONS:" -ForegroundColor Yellow
Write-Host "   New Construction Budget: $" -NoNewline
Write-Host "$($response.calculations.newBudget)" -ForegroundColor Cyan
Write-Host "   Remodel Budget: $" -NoNewline
Write-Host "$($response.calculations.remodelBudget)" -ForegroundColor Cyan
Write-Host "   Total Budget: $" -NoNewline
Write-Host "$($response.calculations.totalBudget)" -ForegroundColor Cyan

# Category budgets
Write-Host "`n2. CATEGORY BUDGETS:" -ForegroundColor Yellow
Write-Host "   Shell Budget Total: $" -NoNewline
Write-Host "$($response.calculations.shellBudgetTotal)" -ForegroundColor Cyan
Write-Host "   Interior Budget Total: $" -NoNewline
Write-Host "$($response.calculations.interiorBudgetTotal)" -ForegroundColor Cyan
Write-Host "   Landscape Budget Total: $" -NoNewline
Write-Host "$($response.calculations.landscapeBudgetTotal)" -ForegroundColor Cyan

# Engineering budgets
Write-Host "`n3. DESIGN DISCIPLINE BUDGETS:" -ForegroundColor Yellow
Write-Host "   Architecture Budget: $" -NoNewline
Write-Host "$($response.calculations.architectureBudget)" -ForegroundColor Cyan
Write-Host "   Structural Budget: $" -NoNewline
Write-Host "$($response.calculations.structuralBudget)" -ForegroundColor Cyan
Write-Host "   Civil Budget: $" -NoNewline
Write-Host "$($response.calculations.civilBudget)" -ForegroundColor Cyan
Write-Host "   Mechanical Budget: $" -NoNewline
Write-Host "$($response.calculations.mechanicalBudget)" -ForegroundColor Cyan
Write-Host "   Electrical Budget: $" -NoNewline
Write-Host "$($response.calculations.electricalBudget)" -ForegroundColor Cyan
Write-Host "   Plumbing Budget: $" -NoNewline
Write-Host "$($response.calculations.plumbingBudget)" -ForegroundColor Cyan
Write-Host "   Telecom Budget: $" -NoNewline
Write-Host "$($response.calculations.telecomBudget)" -ForegroundColor Cyan

# Get project details for shares
$project = $response.project

Write-Host "`n4. SHARE PERCENTAGES (from project):" -ForegroundColor Yellow
Write-Host "   Shell Share: " -NoNewline
$shellShareValue = if ($project.shellShareOverride) { $project.shellShareOverride } else { 'Not set' }
Write-Host "$shellShareValue" -ForegroundColor Cyan
Write-Host "   Interior Share: " -NoNewline
$interiorShareValue = if ($project.interiorShareOverride) { $project.interiorShareOverride } else { 'Not set' }
Write-Host "$interiorShareValue" -ForegroundColor Cyan
Write-Host "   Landscape Share: " -NoNewline
$landscapeShareValue = if ($project.landscapeShareOverride) { $project.landscapeShareOverride } else { 'Not set' }
Write-Host "$landscapeShareValue" -ForegroundColor Cyan

# Fee calculations
Write-Host "`n5. FEE CALCULATIONS:" -ForegroundColor Yellow
$fees = $response.fees
foreach ($fee in $fees) {
    if ($fee.scope -like "*Architecture*" -or $fee.scope -like "*Scan to Bim*") {
        Write-Host "   $($fee.scope):" -ForegroundColor White
        Write-Host "     Market Fee: $" -NoNewline
        Write-Host "$($fee.marketFee)" -ForegroundColor Cyan
        Write-Host "     Rate per sq ft: $" -NoNewline
        Write-Host "$($fee.ratePerSqFt)" -ForegroundColor Cyan
        if ($fee.percentOfCost) {
            $percent = [decimal]$fee.percentOfCost * 100
            Write-Host "     Percent of Cost: " -NoNewline
            Write-Host "$($percent.ToString('F4'))%" -ForegroundColor Cyan
        }
    }
}

# Hours calculations
Write-Host "`n6. HOURS CALCULATIONS:" -ForegroundColor Yellow
$totalHours = $response.hours | Where-Object {$_.phase -eq "Total"}
if ($totalHours) {
    Write-Host "   Total Louis Amy Hours: " -NoNewline
    Write-Host "$($totalHours.totalHours)" -ForegroundColor Cyan
}

# Summary validation
Write-Host "`n7. KEY FORMULA VALIDATIONS:" -ForegroundColor Yellow

# Calculate expected architecture percentage
$shellShare = 0.62  # From database for this building type
$engineeringSum = 0.02 + 0.01 + 0.016 + 0.016 + 0.011 + 0.005  # Sum of engineering shares
$expectedArchPercentage = (1 - $engineeringSum) * $shellShare
Write-Host "   Expected Architecture % = (1 - Engineering Sum) * Shell Share" -ForegroundColor White
Write-Host "   = (1 - $engineeringSum) * $shellShare = " -NoNewline
Write-Host "$($expectedArchPercentage.ToString('F4'))" -ForegroundColor Cyan

# Calculate actual from budget
$actualArchPercentage = [decimal]$response.calculations.architectureBudget / [decimal]$response.calculations.shellBudgetTotal
Write-Host "   Actual Architecture % = Architecture Budget / Shell Budget" -ForegroundColor White
Write-Host "   = $($response.calculations.architectureBudget) / $($response.calculations.shellBudgetTotal) = " -NoNewline
Write-Host "$($actualArchPercentage.ToString('F4'))" -ForegroundColor Cyan

Write-Host "`n=========================================" -ForegroundColor Green
