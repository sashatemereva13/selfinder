import "./RouteLoader.css";

export default function RouteLoader() {
  return (
    <div className="sf-routeLoader" role="status" aria-live="polite" aria-label="Loading page">
      <div className="sf-routeLoaderPanel">
        <p className="sf-kicker">Signal Transition</p>
        <div className="sf-routeLoaderTitle">Mapping next chamber</div>
        <div className="sf-routeLoaderBar" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
