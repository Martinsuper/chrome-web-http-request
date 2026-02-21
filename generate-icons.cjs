const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  
  // 创建渐变背景（蓝绿色）
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#00b4db");
  gradient.addColorStop(1, "#0083b0");
  
  // 绘制圆角矩形背景
  const radius = size * 0.15;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();
  
  // 计算图标位置和大小
  const padding = size * 0.125;
  const iconSize = size - padding * 2;
  const scale = iconSize / 20;
  
  // 绘制白色网络/请求图标（地球 + 箭头）
  ctx.fillStyle = "white";
  ctx.save();
  ctx.translate(padding, padding);
  ctx.scale(scale, scale);
  
  // 地球仪（圆形）
  ctx.beginPath();
  ctx.arc(10, 10, 8, 0, Math.PI * 2);
  ctx.fill();
  
  // 地球仪内部线条（经纬线）
  ctx.strokeStyle = "#0083b0";
  ctx.lineWidth = 1.2;
  
  // 经线
  ctx.beginPath();
  ctx.ellipse(10, 10, 3, 7, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  // 纬线
  ctx.beginPath();
  ctx.ellipse(10, 10, 7, 3, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  // 箭头（表示请求）
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(14, 6);
  ctx.lineTo(18, 10);
  ctx.lineTo(14, 14);
  ctx.lineTo(15.5, 15.5);
  ctx.lineTo(20, 11);
  ctx.lineTo(15.5, 6.5);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
  
  return canvas;
}

function generateIcons() {
  const publicDir = path.join(__dirname, "public");
  const sizes = [16, 48, 128];
  
  console.log("🎨 正在生成图标...");
  
  sizes.forEach(size => {
    const canvas = drawIcon(size);
    const buffer = canvas.toBuffer("image/png");
    const filename = `icon-${size}.png`;
    const filepath = path.join(publicDir, filename);
    
    fs.writeFileSync(filepath, buffer);
    console.log(`✅ 已生成：${filename} (${size}x${size})`);
  });
  
  console.log("\\n✨ 所有图标已生成到 public 文件夹！");
}

generateIcons();
