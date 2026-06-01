import { Component } from "react";

/* Catches any render/runtime error inside /world so the screen shows a message
   instead of going blank. */
export default class WorldBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("World crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="grain flex min-h-[70vh] flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="text-4xl">🌧️</div>
          <h2 className="font-display text-2xl font-bold">Our world hit a snag</h2>
          <p className="max-w-md text-ink-soft">
            The 3D scene failed to load. The rest of the app still works — use the dock to go back.
          </p>
          <pre className="max-w-md overflow-auto rounded-xl bg-black/5 p-3 text-left text-xs text-red-700">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="rounded-2xl bg-coral px-4 py-2 font-semibold text-white"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
