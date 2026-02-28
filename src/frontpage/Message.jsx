import PanchangBase64 from "/fontsCSS/panchang-base64.txt?raw";
import Labels from "../list/LabelsList";
import { useEffect, useState } from "react";
import saveIcon from "/saveIcon.svg";

const Message = ({
  selectedMessage,
  setSelectedMessage,
  setControlsEnabled,
}) => {
  const [randomLabel, setRandomLabel] = useState("");

  useEffect(() => {
    if (selectedMessage) {
      setRandomLabel(Labels[Math.floor(Math.random() * Labels.length)]);
    }
  }, [selectedMessage]);

  const downloadAsPNG = () => {
    if (!selectedMessage) return;

    const font = new FontFace(
      "Panchang",
      `url(data:font/woff2;base64,${PanchangBase64})`
    );

    if (!CanvasRenderingContext2D.prototype.roundRect) {
      CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        this.beginPath();
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
      };
    }

    font.load().then((loadedFont) => {
      document.fonts.add(loadedFont);

      const canvas = document.createElement("canvas");
      canvas.width = 1000;
      canvas.height = 1000;
      const ctx = canvas.getContext("2d");

      // 1. Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#1a0f20");
      gradient.addColorStop(1, "#0a1414");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Radial ripple pattern (like the modal background)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.strokeStyle = "rgba(0, 255, 229, 0.1)";
      for (let r = 50; r < 800; r += 50) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // 3. Message card
      const cardWidth = 700;
      const cardHeight = 700;
      const cardX = (canvas.width - cardWidth) / 2;
      const cardY = centerY - cardHeight / 2;

      ctx.shadowColor = "rgba(200, 150, 255, 0.1)";
      ctx.shadowBlur = 60;
      ctx.fillStyle = "rgba(38, 31, 46, 0.45)";
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 40);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 4. Label (title)
      ctx.fillStyle = "#CDB8DA";
      ctx.font = "30px 'Panchang'";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      ctx.fillText(randomLabel, canvas.width / 2, cardY + 70);

      // 5. Message
      const messageLines = [];
      const words = selectedMessage.message.split(" ");
      const maxWidth = 620;
      let line = "";

      ctx.font = "22px 'Panchang'";
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        if (ctx.measureText(testLine).width > maxWidth) {
          messageLines.push(line.trim());
          line = words[i] + " ";
        } else {
          line = testLine;
        }
      }
      messageLines.push(line.trim());

      ctx.fillStyle = "#AF9DBA";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      const startY =
        cardY + 100 + (cardHeight - 100 - messageLines.length * 44) / 2;

      messageLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + index * 44);
      });

      // 6. Signature
      ctx.fillStyle = "#9d75cc";
      ctx.font = "18px 'Panchang'";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(
        "selfinder.online — with love, sasha",
        canvas.width / 2,
        canvas.height - 40
      );

      // 7. Export
      const link = document.createElement("a");
      link.download = "message.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  useEffect(() => {
    if (selectedMessage) {
      setControlsEnabled(false);
    } else {
      setControlsEnabled(true);
    }
    return () => setControlsEnabled(true);
  }, [selectedMessage]);

  if (!selectedMessage) return null;

  return (
    <div className="messageOverlay">
      <div className="messageModal">
        <button
          onClick={() => setSelectedMessage(null)}
          className="closeButton"
        >
          ✕
        </button>

        <div className="tickerLabel">{randomLabel}</div>
        <div className="tickerMessage">{selectedMessage.message}</div>
        <button onClick={downloadAsPNG} className="saveButton">
          save it for later?
        </button>
      </div>
    </div>
  );
};

export default Message;
