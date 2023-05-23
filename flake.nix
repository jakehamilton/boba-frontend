{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-22.11";

    snowfall-lib = {
      url = "github:snowfallorg/lib";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = inputs:
    inputs.snowfall-lib.mkFlake
      {
        inherit inputs;
        src = ./.;

        overlay-package-namespace = "bobaboard";

        outputs-builder = channels:
          let
            inherit (channels.nixpkgs) buildNpmPackage mkYarnPackage stdenv nodejs;
          in
          {
            packages = rec {
              default = frontend;

              frontend = buildNpmPackage {
                pname = "boba-frontend";
                version = "unstable-${inputs.self.sourceInfo.shortRev or "dirty"}";

                src = ./.;

                CYPRESS_INSTALL_BINARY = "0";

                npmDepsHash = "sha256-kqrmqh/JWGDLmT4ZRZ8LizB0puVmxuz250LUcZziYhg=";
                npmFlags = [ "--legacy-peer-deps" ];
                npmInstallFlags = [ "--ignore-scripts" ];

                NODE_OPTIONS = "--openssl-legacy-provider";
              };
            };
          };
      };
}
