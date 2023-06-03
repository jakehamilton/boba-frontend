{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-22.11";
    systems.url = "github:nix-systems/default";
  };

  outputs = { self, nixpkgs, systems, ... } @ inputs:
    # let
    #   forEachSystem = nixpkgs.lib.genAttrs (import systems);
    # in
    # forEachSystem (system:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      packages.${system} = rec {
        boba-frontend-assets = pkgs.yarn2nix-moretea.mkYarnPackage {
          name = "boba-frontend";
          version = "0.0.1";
          src = ./.;
          dontFixup = true;
          doDist = false;
          nodejs = pkgs.nodejs-16_x;
          NODE_OPTIONS = "--openssl-legacy-provider";
          buildPhase = ''
            yarn build
          '';
          distPhase = "";
          installPhase = ''
            mkdir -p $out/libexec/boba-frontend
            mv node_modules $out/libexec/boba-frontend/
            mv deps $out/libexec/boba-frontend/
          '';
        };
        boba-frontend = pkgs.writeShellScriptBin "boba-frontend" ''
          export NODE_PATH=${boba-frontend-assets}/libexec/boba-frontend/node_modules
          export DEBUG=boba-frontend:*,-*info

          ${boba-frontend-assets}/libexec/boba-frontend/node_modules/.bin/next start "${boba-frontend-assets}/libexec/boba-frontend/deps/bobaboard-frontend"
        '';
        default = boba-frontend;
      };
    };
  # );
}

