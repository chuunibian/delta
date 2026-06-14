{
  description = "Dev environment for delta-disk-analyser (Tauri v2 + Vite/React)";

  # Pinned for reproducibility (flake.lock); bump with `nix flake update`.
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShells.${system}.default = pkgs.mkShell {
        name = "delta-disk-analyser";

        # Build tools (run on the host arch).
        nativeBuildInputs = with pkgs; [
          pkg-config
          gobject-introspection
          rustc
          cargo
          nodejs
        ];

        # The GUI/runtime stack. webkitgtk_4_1 provides the webkit2gtk-4.1.pc
        # that the wry/tauri sys-crates link against, and propagates gtk3/soup/etc.
        buildInputs = with pkgs; [
          webkitgtk_4_1
          gtk3
          libsoup_3
          cairo
          pango
          gdk-pixbuf
          atkmm
          harfbuzz
          librsvg
          openssl
          xdotool                 # libxdo — required by tauri on Linux
          libayatana-appindicator # system-tray support
          glib-networking         # GIO TLS backend so the webview can fetch https
        ];

        shellHook = ''
          # Let GIO find the TLS module and GTK find its gsettings schemas at runtime,
          # otherwise the dev binary launched from this shell can't do https / settings.
          export GIO_EXTRA_MODULES="${pkgs.glib-networking}/lib/gio/modules''${GIO_EXTRA_MODULES:+:$GIO_EXTRA_MODULES}"
          export XDG_DATA_DIRS="${pkgs.gtk3}/share/gsettings-schemas/${pkgs.gtk3.name}:${pkgs.gsettings-desktop-schemas}/share/gsettings-schemas/${pkgs.gsettings-desktop-schemas.name}:''${XDG_DATA_DIRS:-/usr/local/share:/usr/share}"
          echo "delta-disk-analyser dev shell ready."
          echo "  build the frontend + binary:  npm install && npm run tauri build -- --no-bundle"
          echo "  or run in dev mode:           npm run tauri dev"
        '';
      };
    };
}
