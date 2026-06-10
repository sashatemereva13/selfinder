import { useEffect, useState } from "react";

const StarsBackground = () => {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const generateStars = () => {
      const newStars = Array.from({ length: 100 }).map((_, i) => ({
        id: i,
        top: `${Math.random() * 100}vh`,
        left: `${Math.random() * 100}vw`,
        animationDuration: `${Math.random() * 3 + 2}s`,
      }));
      setStars(newStars);
    };

    generateStars();
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute w-1 h-1 bg-white rounded-full opacity-80 animate-pulse"
          style={{
            top: star.top,
            left: star.left,
            animationDuration: star.animationDuration,
          }}
        />
      ))}
    </div>
  );
};

export default StarsBackground;
