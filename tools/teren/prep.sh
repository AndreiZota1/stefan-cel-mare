#!/bin/bash
# Texturile terenului (CC0: ambientCG și Poly Haven), micșorate pentru joc: culoarea 512 px, relieful fin 256 px.
# Sursele 1K se descarcă în /tmp/scm (vezi lista de mai jos); ieșirea merge în out/, apoi `node pack.js` scrie js/tex-teren.js.
set -e
D=/tmp/scm; O=$(dirname "$0")/out; mkdir -p "$O"
L=(
 "grassA  $D/dl/Grass004/Grass004_1K-JPG_Color.jpg  $D/dl/Grass004/Grass004_1K-JPG_NormalGL.jpg"
 "grassB  $D/dl/Grass007/Grass007_1K-JPG_Color.jpg  $D/dl/Grass007/Grass007_1K-JPG_NormalGL.jpg"
 "grassK  $D/dl/Grass001/Grass001_1K-JPG_Color.jpg  $D/dl/Grass001/Grass001_1K-JPG_NormalGL.jpg"
 "grassY  $D/dl/Ground037/Ground037_1K-JPG_Color.jpg $D/dl/Ground037/Ground037_1K-JPG_NormalGL.jpg"
 "worn    $D/dl/Ground003/Ground003_1K-JPG_Color.jpg $D/dl/Ground003/Ground003_1K-JPG_NormalGL.jpg"
 "dirt    $D/ph/dry_ground_rocks.jpg  $D/ph/dry_ground_rocks_nor.jpg"
 "sand    $D/ph/sand_01.jpg           $D/ph/sand_01_nor.jpg"
 "rock    $D/ph/aerial_rocks_02.jpg   $D/ph/aerial_rocks_02_nor.jpg"
 "gravel  $D/ph/rock_ground.jpg       $D/ph/rock_ground_nor.jpg"
 "forest  $D/ph/forrest_ground_01.jpg $D/ph/forrest_ground_01_nor.jpg"
 "forestK $D/ph/mud_forest.jpg        $D/ph/mud_forest_nor.jpg"
 "mud     $D/ph/brown_mud_02.jpg      $D/ph/brown_mud_02_nor.jpg"
 "snow    $D/ph/snow_02.jpg           $D/ph/snow_02_nor.jpg"
 "snowR   $D/ph/snow_field_aerial.jpg $D/ph/snow_field_aerial_nor.jpg"
 "bed     $(dirname "$0")/../tex/river_small_rocks_diff.jpg $(dirname "$0")/../tex/river_small_rocks_nor.jpg"
 "rockG   $D/ph/aerial_rocks_04.jpg   $D/ph/aerial_rocks_04_nor.jpg"
)
for row in "${L[@]}"; do
  set -- $row
  sips -z 512 512 "$2" -s format jpeg -s formatOptions 80 --out "$O/$1_d.jpg" >/dev/null
  sips -z 256 256 "$3" -s format jpeg -s formatOptions 84 --out "$O/$1_n.jpg" >/dev/null
done
ls -la "$O" | awk '{s+=$5} END {print "total", s}'
