# Baota Node Deployment

The tracker needs the Node server in `server.js` running in production. It serves the webpage, audio files, and the `/api/packs` and `/api/presets` browser APIs. Do not configure the site as a PHP static site.

1. Upload the whole project directory, including `index.html`, `server.js`, `package.json`, `fonts/`, `presets/`, and `packs/`.
2. In Baota's Node Project manager, add a project whose root directory is this project directory.
3. Select Node.js 18 or newer, set the startup command to `npm start`, and set the port to `3000` (or another unused port).
4. Start the Node project and enable its reverse proxy/domain binding in Baota so your domain forwards to that port.
5. Ensure the web server user can read the `packs/` directory and its files.

After publishing, open this URL in a browser:

```
https://your-domain.example/api/packs
```

It must return JSON with a `samples` array. `https://your-domain.example/api/presets` must return a `presets` array. A 502 means the Node project is not running or the reverse proxy uses the wrong port. A 404 means the domain points to a static site instead of the Node project.

Use the tracker at `https://your-domain.example/`, select an AUDIO track, then press `Ctrl+Enter` (or `Cmd+Enter` on macOS). The pack browser accepts keyboard input only:

- Type: filter file paths
- Up/Down: move selection
- PageUp/PageDown, Home/End: navigate quickly
- Enter: import selected sample
- Esc: close the browser

Press `Ctrl+O` (or `Cmd+O` on macOS) to open the server preset browser. Use the same navigation keys and press Enter to load the selected preset.