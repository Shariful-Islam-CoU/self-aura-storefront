# ---------------------------------------------------------------------------
# Self Aura Storefront - placeholder image generator
#
# Generates abstract, editorial-style placeholder PNGs (soft gradients, subtle
# radial glows and arc motifs) under public/images/. These are NOT product
# photos - they only establish the visual language until real Self Aura
# campaign/product assets exist. Replace the PNGs with real assets when ready;
# component code does not depend on this script (paths are stable).
#
# Run from the repo root:  powershell -ExecutionPolicy Bypass -File ./scripts/generate-placeholders.ps1
# Requires Windows PowerShell with System.Drawing (available on Windows).
# ---------------------------------------------------------------------------

Add-Type -AssemblyName System.Drawing

$outRoot = Join-Path $PSScriptRoot "..\public\images"
New-Item -ItemType Directory -Force -Path $outRoot | Out-Null

function Get-Color {
  param([string]$Hex, [int]$Alpha = 255)
  $hex = $Hex.TrimStart('#')
  $r = [Convert]::ToInt32($hex.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($hex.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($hex.Substring(4, 2), 16)
  return [System.Drawing.Color]::FromArgb($Alpha, $r, $g, $b)
}

function Write-SaImage {
  param(
    [string]$OutFile,
    [int]$W,
    [int]$H,
    [string]$TopHex,
    [string]$BottomHex,
    [string]$AccentHex,
    [double]$GlowAlpha = 28,
    [int]$VignetteAlpha = 80,
    [switch]$NoArcs
  )

  $bmp = New-Object System.Drawing.Bitmap($W, $H)
  $gfx = [System.Drawing.Graphics]::FromImage($bmp)
  $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $rect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)

  # Base vertical gradient.
  $lin = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect, (Get-Color $TopHex), (Get-Color $BottomHex), 90.0)
  $gfx.FillRectangle($lin, $rect)

  $transparent = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)

  # Soft radial glow, upper-left.
  $glow = Get-Color $AccentHex ([int]$GlowAlpha)
  $cx = $W * 0.30
  $cy = $H * 0.18
  $radius = [Math]::Max($W, $H) * 0.55
  $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
  $gp.AddEllipse([single]($cx - $radius), [single]($cy - $radius), [single](2 * $radius), [single](2 * $radius))
  $radBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($gp)
  $radBrush.CenterColor = $glow
  $surround = New-Object 'System.Drawing.Color[]' $gp.PointCount
  for ($i = 0; $i -lt $gp.PointCount; $i++) { $surround[$i] = $transparent }
  $radBrush.SurroundColors = $surround
  $gfx.FillPath($radBrush, $gp)

  # Weaker glow, lower-right.
  $glow2 = Get-Color $AccentHex ([int]($GlowAlpha * 0.45))
  $cx2 = $W * 0.86
  $cy2 = $H * 0.82
  $radius2 = [Math]::Max($W, $H) * 0.42
  $gp2 = New-Object System.Drawing.Drawing2D.GraphicsPath
  $gp2.AddEllipse([single]($cx2 - $radius2), [single]($cy2 - $radius2), [single](2 * $radius2), [single](2 * $radius2))
  $radBrush2 = New-Object System.Drawing.Drawing2D.PathGradientBrush($gp2)
  $radBrush2.CenterColor = $glow2
  $radBrush2.SurroundColors = [System.Drawing.Color[]]@($transparent) * $gp2.PointCount
  $gfx.FillPath($radBrush2, $gp2)

  # Concentric arc motif (elegant wave, upper-right origin).
  if (-not $NoArcs) {
    $arcColor = Get-Color $AccentHex 95
    $pen = New-Object System.Drawing.Pen($arcColor, 1.4)
    $fx = $W * 0.74
    $fy = $H * 0.80
    for ($i = 0; $i -lt 4; $i++) {
      $arcRadius = ($W * 0.09) + ($i * $W * 0.085)
      $x = $fx - $arcRadius
      $y = $fy - ($arcRadius * 1.3)
      $w = 2 * $arcRadius
      $h = 2 * $arcRadius * 1.3
      $gfx.DrawArc($pen, [single]$x, [single]$y, [single]$w, [single]$h, 145, 165)
    }
    $pen.Dispose()
  }

  # Bottom vignette for depth.
  if ($VignetteAlpha -gt 0) {
    $vy = $H * 0.45
    $vH = $H - $vy
    $vigRect = New-Object System.Drawing.Rectangle(0, [int]$vy, $W, [int]$vH)
    $v1 = [System.Drawing.Color]::FromArgb(0, 20, 16, 10)
    $v2 = [System.Drawing.Color]::FromArgb($VignetteAlpha, 20, 16, 10)
    $vig = New-Object System.Drawing.Drawing2D.LinearGradientBrush($vigRect, $v1, $v2, 90.0)
    $gfx.FillRectangle($vig, $vigRect)
    $vig.Dispose()
  }

  $lin.Dispose()
  $gp.Dispose()
  $radBrush.Dispose()
  $gfx.Dispose()

  $bmp.Save($OutFile, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output ([System.IO.Path]::GetFileName($OutFile))
}

# --- Hero (editorial champagne/bronze) ---
Write-SaImage -OutFile (Join-Path $outRoot "hero-desktop.png") -W 1440 -H 1800 `
  -TopHex "#F3EADD" -BottomHex "#C9AE88" -AccentHex "#7A5C33" -GlowAlpha 30 -VignetteAlpha 70

Write-SaImage -OutFile (Join-Path $outRoot "hero-mobile.png") -W 1080 -H 1350 `
  -TopHex "#F3EADD" -BottomHex "#C9AE88" -AccentHex "#7A5C33" -GlowAlpha 30 -VignetteAlpha 70

# --- Wide brand banner ---
Write-SaImage -OutFile (Join-Path $outRoot "banner-desktop.jpg") -W 1920 -H 840 `
  -TopHex "#F0E3CE" -BottomHex "#BFA06F" -AccentHex "#7A5C33" -GlowAlpha 34 -VignetteAlpha 95

# --- Categories ---
$categories = @(
  @{ file = "category-abaya.png";       top = "#EAE3D8"; bottom = "#B6A48F"; accent = "#6A5A44" },
  @{ file = "category-hijab.png";       top = "#E6E9E2"; bottom = "#9FAD9E"; accent = "#55624F" },
  @{ file = "category-jewelry.png";     top = "#F3E8D7"; bottom = "#CDAD82"; accent = "#8A6733" },
  @{ file = "category-accessories.png"; top = "#EDE7E0"; bottom = "#B4A595"; accent = "#6B5C4D" }
)
foreach ($c in $categories) {
  Write-SaImage -OutFile (Join-Path $outRoot $c.file) -W 800 -H 1000 `
    -TopHex $c.top -BottomHex $c.bottom -AccentHex $c.accent -GlowAlpha 30 -VignetteAlpha 75
}

# --- Products (12 muted variations) ---
$products = @(
  @{ top = "#F3E9D9"; bottom = "#C9AF8B"; accent = "#8C6D42" },
  @{ top = "#F4E6E1"; bottom = "#CFAFA4"; accent = "#8E6A5E" },
  @{ top = "#E7EBE2"; bottom = "#A8B8A6"; accent = "#5F7162" },
  @{ top = "#E6E8EB"; bottom = "#A5ADB8"; accent = "#5A6472" },
  @{ top = "#EFE7D8"; bottom = "#C3B394"; accent = "#7D6A45" },
  @{ top = "#EFE0D5"; bottom = "#C29B7E"; accent = "#7E5B41" },
  @{ top = "#EAE9EA"; bottom = "#AEB0B8"; accent = "#61646E" },
  @{ top = "#EAEADF"; bottom = "#AEB49A"; accent = "#6A7055" },
  @{ top = "#F0E2DC"; bottom = "#C2A08F"; accent = "#7D5C4C" },
  @{ top = "#EAE4DC"; bottom = "#B5A79B"; accent = "#6E6256" },
  @{ top = "#F3E6D3"; bottom = "#C0A06F"; accent = "#83652F" },
  @{ top = "#EFEEEA"; bottom = "#B9B9B6"; accent = "#6E6E6A" }
)
for ($i = 0; $i -lt $products.Count; $i++) {
  $p = $products[$i]
  $name = "product-{0:D2}.png" -f ($i + 1)
  Write-SaImage -OutFile (Join-Path $outRoot $name) -W 720 -H 900 `
    -TopHex $p.top -BottomHex $p.bottom -AccentHex $p.accent -GlowAlpha 30 -VignetteAlpha 70
}

Write-Output "Done. Images written to $outRoot"