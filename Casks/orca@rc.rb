cask "orca@rc" do
  arch arm: "arm64", intel: "x64"

  version "1.4.36-rc.3"
  sha256 arm:   "563b6b14323fc9d5489299c82442d514bc12cabffc9d06d3964ed572af4b3955",
         intel: "457088c7021f07de1a419197f7b2bd00092741ad4727d4fef3d86af38a6831e7"

  url "https://github.com/OnlyYu1996/orca/releases/download/v#{version}/sbbgt-macos-#{arch}.dmg",
      verified: "github.com/OnlyYu1996/orca/"
  name "赛博包工头 RC"
  desc "面向并行智能体开发的开源 IDE 预发布版"
  homepage "https://github.com/OnlyYu1996/orca"

  livecheck do
    url "https://github.com/OnlyYu1996/orca"
    regex(/^v?(\d+(?:\.\d+)+-rc\.\d+)$/i)
    strategy :github_releases do |json, regex|
      json.map do |release|
        next if release["draft"]
        next unless release["prerelease"]

        match = release["tag_name"]&.match(regex)
        next if match.blank?

        match[1]
      end
    end
  end

  # Why: RC installs should follow Orca's prerelease-aware updater instead of
  # waiting for Homebrew metadata churn between frequent release candidates.
  auto_updates true
  conflicts_with cask: "orca"
  depends_on macos: :big_sur

  app "赛博包工头.app"

  # Why: expose the bundled `orca` CLI on PATH at install time (Homebrew symlinks
  # this into its already-on-PATH bin dir). Without it, the CLI is only registered
  # by the in-app "Install CLI" action, which a headless host can never trigger —
  # so `orca serve` on a server would be unreachable from the shell. The shim
  # resolves the real app by walking symlinks, so the Homebrew symlink works.
  binary "#{appdir}/赛博包工头.app/Contents/Resources/bin/sbbgt"

  # Why: Orca writes user data under ~/.orca (worktrees, agent state) and
  # Electron's standard userData directories. Zap removes everything the app
  # creates during normal use so `brew uninstall --zap` is a clean slate.
  zap trash: [
    "~/.orca",
    "~/.sbbgt",
    "~/Library/Application Support/Orca",
    "~/Library/Application Support/sbbgt",
    "~/Library/Caches/com.onlyyu.sbbgt",
    "~/Library/Caches/com.onlyyu.sbbgt.ShipIt",
    "~/Library/HTTPStorages/com.onlyyu.sbbgt",
    "~/Library/Preferences/com.onlyyu.sbbgt.plist",
    "~/Library/Saved Application State/com.onlyyu.sbbgt.savedState",
    "~/Library/Caches/com.stablyai.orca",
    "~/Library/Caches/com.stablyai.orca.ShipIt",
    "~/Library/HTTPStorages/com.stablyai.orca",
    "~/Library/Preferences/com.stablyai.orca.plist",
    "~/Library/Saved Application State/com.stablyai.orca.savedState",
  ]
end
