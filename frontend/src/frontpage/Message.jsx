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
      `url(data:font/woff2;base64,${PanchangBase64})`,
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
      if (!ctx) return;

      const wrapText = (text, maxWidth, fontSize) => {
        ctx.font = `${fontSize}px 'Panchang'`;
        const words = text.split(" ");
        const lines = [];
        let line = "";

        for (let i = 0; i < words.length; i += 1) {
          const testLine = `${line}${words[i]} `;
          if (ctx.measureText(testLine).width > maxWidth && line) {
            lines.push(line.trim());
            line = `${words[i]} `;
          } else {
            line = testLine;
          }
        }

        if (line.trim()) lines.push(line.trim());
        return lines;
      };

      // 1. Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#150f22");
      gradient.addColorStop(1, "#091118");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Soft ambient glow + subtle radial pattern
      const orbA = ctx.createRadialGradient(220, 210, 0, 220, 210, 300);
      orbA.addColorStop(0, "rgba(178, 132, 239, 0.22)");
      orbA.addColorStop(1, "rgba(178, 132, 239, 0)");
      ctx.fillStyle = orbA;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const orbB = ctx.createRadialGradient(760, 740, 0, 760, 740, 340);
      orbB.addColorStop(0, "rgba(117, 221, 214, 0.16)");
      orbB.addColorStop(1, "rgba(117, 221, 214, 0)");
      ctx.fillStyle = orbB;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.strokeStyle = "rgba(230, 216, 255, 0.08)";
      for (let r = 80; r < 840; r += 62) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // 3. Message card
      const cardWidth = 760;
      const cardHeight = 760;
      const cardX = (canvas.width - cardWidth) / 2;
      const cardY = centerY - cardHeight / 2;

      ctx.shadowColor = "rgba(16, 8, 28, 0.55)";
      ctx.shadowBlur = 64;
      ctx.fillStyle = "rgba(38, 31, 52, 0.58)";
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 34);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
      ctx.lineWidth = 1;
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 34);
      ctx.stroke();

      // 4. Label (title)
      ctx.fillStyle = "rgba(235, 223, 250, 0.95)";
      ctx.font = "26px 'Panchang'";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(randomLabel, canvas.width / 2, cardY + 70);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cardX + 90, cardY + 118);
      ctx.lineTo(cardX + cardWidth - 90, cardY + 118);
      ctx.stroke();

      // 5. Message
      const maxTextWidth = 620;
      const messageLines = wrapText(selectedMessage.message, maxTextWidth, 22);
      const lineHeight = 42;

      ctx.fillStyle = "#d4c4eb";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const textAreaTop = cardY + 160;
      const textAreaBottom = cardY + cardHeight - 150;
      const textBlockHeight = messageLines.length * lineHeight;
      const startY =
        textAreaTop + (textAreaBottom - textAreaTop - textBlockHeight) / 2;

      messageLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
      });

      // 6. Footer
      const dateLabel = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.beginPath();
      ctx.moveTo(cardX + 90, cardY + cardHeight - 110);
      ctx.lineTo(cardX + cardWidth - 90, cardY + cardHeight - 110);
      ctx.stroke();

      ctx.fillStyle = "rgba(220, 199, 246, 0.9)";
      ctx.font = "16px 'Panchang'";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(
        "selfinder.online  |  with love, sasha",
        canvas.width / 2,
        cardY + cardHeight - 58,
      );

      ctx.fillStyle = "rgba(196, 173, 226, 0.78)";
      ctx.font = "14px 'Panchang'";
      ctx.fillText(dateLabel, canvas.width / 2, cardY + cardHeight - 30);

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
    <div
      className="messageOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="message-title"
    >
      <div className="messageModal messsageModal">
        <button
          type="button"
          onClick={() => setSelectedMessage(null)}
          className="closeButton"
          aria-label="Close message"
        >
          ✕
        </button>

        <div id="message-title" className="tickerLabel">
          {randomLabel}
        </div>
        <div className="tickerMessage">{selectedMessage.message}</div>

        <div className="saveitDiv">
          <p className="messageHint">resonates? save it for later</p>
          <button type="button" onClick={downloadAsPNG} className="saveButton">
            <img src={saveIcon} alt="" aria-hidden="true" />
            &nbsp; save it
          </button>
        </div>
      </div>
    </div>
  );
};

export default Message;
