cask "orca" do
  arch arm: "arm64", intel: "x64"

  version "1.3.24"
  sha256 arm:   "fc707f290ff3b631b7b7947bf339885b61a43d2e89475997c125b61268ed4966",
         intel: "5f677c13a08f7a5740442e29d388285a86488c8c1f7aa5f10a8721a2c6ede8e4"

  url "https://github.com/OnlyYu1996/orca/releases/download/v#{version}/sbbgt-macos-#{arch}.dmg",
      verified: "github.com/OnlyYu1996/orca/"
  name "赛博包工头"
  desc "面向并行智能体开发的开源 IDE"
  homepage "https://github.com/OnlyYu1996/orca"

  livecheck do
    url :url
    strategy :github_latest
  end

  # Why: electron-updater (src/main/updater.ts) handles in-place updates by
  # writing a new Orca.app into /Applications. Marking the cask auto_updates
  # tells Homebrew not to compete with the in-app updater — `brew upgrade`
  # becomes a no-op unless the user passes --greedy, and brew's version
  # metadata stays aligned with whatever the app has swapped itself to.
  auto_updates true
  conflicts_with cask: "orca@rc"
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
