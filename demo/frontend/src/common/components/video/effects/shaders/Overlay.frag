#version 300 es
// Copyright (c) Meta Platforms, Inc. and affiliates.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

precision highp float;

in vec2 vTexCoord;

uniform sampler2D uSampler;
uniform vec2 uSize;
uniform int uNumMasks;
uniform float uOpacity;
uniform bool uBorder;
uniform sampler2D uMaskTexture0;
uniform sampler2D uMaskTexture1;
uniform sampler2D uMaskTexture2;
uniform sampler2D uMaskTexture3;
uniform sampler2D uMaskTexture4;
uniform sampler2D uMaskTexture5;
uniform sampler2D uMaskTexture6;
uniform sampler2D uMaskTexture7;
uniform sampler2D uMaskTexture8;
uniform sampler2D uMaskTexture9;
uniform sampler2D uMaskTexture10;
uniform sampler2D uMaskTexture11;
uniform sampler2D uMaskTexture12;
uniform sampler2D uMaskTexture13;
uniform sampler2D uMaskTexture14;

uniform vec4 uMaskColor0;
uniform vec4 uMaskColor1;
uniform vec4 uMaskColor2;
uniform vec4 uMaskColor3;
uniform vec4 uMaskColor4;
uniform vec4 uMaskColor5;
uniform vec4 uMaskColor6;
uniform vec4 uMaskColor7;
uniform vec4 uMaskColor8;
uniform vec4 uMaskColor9;
uniform vec4 uMaskColor10;
uniform vec4 uMaskColor11;
uniform vec4 uMaskColor12;
uniform vec4 uMaskColor13;
uniform vec4 uMaskColor14;

uniform float uTime;
uniform vec2 uClickPos;
uniform int uActiveMask;

out vec4 fragColor;

vec4 lowerSaturation(vec4 color, float saturationFactor) {
  float luminance = 0.299f * color.r + 0.587f * color.g + 0.114f * color.b; // Calculate luminance
  vec3 gray = vec3(luminance);
  vec3 saturated = mix(gray, color.rgb, saturationFactor); // Mix gray with original color based on saturation factor
  return vec4(saturated, color.a);
}

vec4 detectEdges(sampler2D textureSampler, float coverage, vec4 edgeColor) {
  vec2 tvTexCoord = vec2(vTexCoord.y, vTexCoord.x);
  vec2 texOffset = 1.0f / uSize;
  vec3 result = vec3(0.0f);
  // neighboring pixels
  vec3 tLeft = texture(textureSampler, tvTexCoord + texOffset * vec2(-coverage, coverage)).rgb;
  vec3 tRight = texture(textureSampler, tvTexCoord + texOffset * vec2(coverage, -coverage)).rgb;
  vec3 bLeft = texture(textureSampler, tvTexCoord + texOffset * vec2(-coverage, -coverage)).rgb;
  vec3 bRight = texture(textureSampler, tvTexCoord + texOffset * vec2(coverage, coverage)).rgb;

  // calculate the gradient edge of the current pixel using [3x3] sobel operator.
  vec3 xEdge = tLeft + 2.0f * texture(textureSampler, tvTexCoord + texOffset * vec2(-coverage, 0)).rgb + bLeft - tRight - 2.0f * texture(textureSampler, tvTexCoord + texOffset * vec2(coverage, 0)).rgb - bRight;
  vec3 yEdge = tLeft + 2.0f * texture(textureSampler, tvTexCoord + texOffset * vec2(0, coverage)).rgb + tRight - bLeft - 2.0f * texture(textureSampler, tvTexCoord + texOffset * vec2(0, -coverage)).rgb - bRight;

  // magnitude of the gradient at the current pixel.
  result = sqrt(xEdge * xEdge + yEdge * yEdge);
  return result.r > 1e-6f ? edgeColor : vec4(0.0f, 0.0f, 0.0f, 0.0f);
}

vec2 calculateAdjustedTexCoord(vec2 vTexCoord, vec4 bbox, float aspectRatio) {
  vec2 center = vec2((bbox.x + bbox.z) * 0.5f, bbox.w);
  float radiusX = abs(bbox.z - bbox.x);
  float radiusY = radiusX / aspectRatio;
  float scale = 1.0f;
  radiusX *= scale;
  radiusY *= scale;
  vec2 adjustedTexCoord = (vTexCoord - center) / vec2(radiusX, radiusY) + vec2(0.5f);
  return adjustedTexCoord;
}

void blendMask(
  sampler2D maskTexture,
  vec4 maskColor,
  int maskIndex,
  vec2 textureCoord,
  vec2 clickCoord,
  inout vec4 finalColor,
  inout float totalMaskValue,
  inout vec4 edgeColor
) {
  float maskValue = texture(maskTexture, textureCoord).r;
  vec4 saturatedColor = lowerSaturation(maskColor / 255.0, 0.7);
  vec4 plainColor = vec4(saturatedColor.rgb, 1.0);

  if (uActiveMask == maskIndex && uTime < 1.1) {
    float distanceToClick = length(clickCoord);
    float colorFactor = abs(sin((distanceToClick - uTime) * 1.75));
    plainColor = vec4(mix(vec4(maskColor.rgb / 255.0, 0.2), plainColor, colorFactor));
  }

  finalColor += maskValue * plainColor;
  totalMaskValue += maskValue;

  if (edgeColor.a <= 0.0) {
    edgeColor = detectEdges(maskTexture, 1.25, maskColor / 255.0);
  }
}

void main() {
  vec4 color = texture(uSampler, vTexCoord);
  float aspectRatio = uSize.y / uSize.x;
  vec2 tvTexCoord = vec2(vTexCoord.y, vTexCoord.x);

  vec4 finalColor = vec4(0.0f, 0.0f, 0.0f, 0.0f);
  float totalMaskValue = 0.0f;
  vec4 edgeColor = vec4(0.0f, 0.0f, 0.0f, 0.0f);
  vec2 adjustedClickCoord =  calculateAdjustedTexCoord(vTexCoord, vec4(uClickPos, uClickPos + 0.1), aspectRatio);

  if(uNumMasks > 0) {
    blendMask(uMaskTexture0, uMaskColor0, 0, tvTexCoord, adjustedClickCoord, finalColor, totalMaskValue, edgeColor);
  }
  if(uNumMasks > 1) {
    blendMask(uMaskTexture1, uMaskColor1, 1, tvTexCoord, adjustedClickCoord, finalColor, totalMaskValue, edgeColor);
  }
  if(uNumMasks > 2) {
    blendMask(uMaskTexture2, uMaskColor2, 2, tvTexCoord, adjustedClickCoord, finalColor, totalMaskValue, edgeColor);
  }
  if(uNumMasks > 3) {
    blendMask(uMaskTexture3, uMaskColor3, 3, tvTexCoord, adjustedClickCoord, finalColor, totalMaskValue, edgeColor);
  }
  if(uNumMasks > 4) {
    blendMask(uMaskTexture4, uMaskColor4, 4, tvTexCoord, adjustedClickCoord, finalColor, totalMaskValue, edgeColor);
  }
  if(uNumMasks > 5) {
    blendMask(uMaskTexture5, uMaskColor5, 5, tvTexCoord, adjustedClickCoord, finalColor, totalMaskValue, edgeColor);
  }
  if(uNumMasks > 6) {
    blendMask(uMaskTexture6, uMaskColor6, 6, tvTexCoord, adjustedClickCoord, finalColor, totalMaskValue, edgeColor);
  }
  if(uNumMasks > 7) {
    blendMask(uMaskTexture7, uMaskColor7, 7, tvTexCoord, adjustedClickCoord, finalColor, totalMaskValue, edgeColor);
  }
  if(uNumMasks > 8) {
    blendMask(uMaskTexture8, uMaskColor8, 8, tvTexCoord, adjustedClickCoord, finalColor, totalMaskValue, edgeColor);
  }
  if(uNumMasks > 9) {
    blendMask(uMaskTexture9, uMaskColor9, 9, tvTexCoord, adjustedClickCoord, finalColor, totalMaskValue, edgeColor);
  }
  if(uNumMasks > 10) {
    blendMask(uMaskTexture10, uMaskColor10, 10, tvTexCoord, adjustedClickCoord, finalColor, totalMaskValue, edgeColor);
  }
  if(uNumMasks > 11) {
    blendMask(uMaskTexture11, uMaskColor11, 11, tvTexCoord, adjustedClickCoord, finalColor, totalMaskValue, edgeColor);
  }
  if(uNumMasks > 12) {
    blendMask(uMaskTexture12, uMaskColor12, 12, tvTexCoord, adjustedClickCoord, finalColor, totalMaskValue, edgeColor);
  }
  if(uNumMasks > 13) {
    blendMask(uMaskTexture13, uMaskColor13, 13, tvTexCoord, adjustedClickCoord, finalColor, totalMaskValue, edgeColor);
  }
  if(uNumMasks > 14) {
    blendMask(uMaskTexture14, uMaskColor14, 14, tvTexCoord, adjustedClickCoord, finalColor, totalMaskValue, edgeColor);
  }

  if(totalMaskValue > 0.0f) {
    finalColor /= totalMaskValue;
    finalColor = mix(color, finalColor, uOpacity);
  } else {
    finalColor.a = 0.0f;
  }

  if(edgeColor.a > 0.0f && uBorder) {
    finalColor = vec4(vec3(edgeColor), 1.0f);
  }
  fragColor = finalColor;
}