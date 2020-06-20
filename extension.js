"use strict";

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const St = imports.gi.St;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const Util = imports.misc.util;

const Config = imports.misc.config;
const SHELL_MINOR = parseInt(Config.PACKAGE_VERSION.split(".")[1]);

var SMBiosIndicator = class SMBiosIndicator extends PanelMenu.Button {
  _init() {
    super._init(0.0, `${Me.metadata.name} Indicator`, false);

    let icon = new St.Icon({
      gicon: new Gio.ThemedIcon({ name: "sensors-fan-symbolic" }),
      style_class: "system-status-icon",
    });
    this.actor.add_child(icon);

    this.menu.addAction(
      "Balanced",
      this.setThermalMode.bind(null, "balanced"),
      null
    );
    this.menu.addAction(
      "Cool Bottom",
      this.setThermalMode.bind(null, "cool-bottom"),
      null
    );
    this.menu.addAction("Quiet", this.setThermalMode.bind(null, "quiet"), null);
    this.menu.addAction(
      "Performance",
      this.setThermalMode.bind(null, "performance"),
      null
    );
  }

  setThermalMode(mode) {
    try {
      let proc = Gio.Subprocess.new(
        ["pkexec"].concat(["smbios-thermal-ctl", "--set-thermal-mode", mode]),
        Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
      );

      proc.communicate_utf8_async(null, null, (proc, res) => {
        try {
          let [, stdout, stderr] = proc.communicate_utf8_finish(res);

          // Failure
          if (!proc.get_successful()) throw new Error(stderr);

          // Success
          log(stdout);
        } catch (e) {
          logError(e);
        }
      });
    } catch (e) {
      logError(e);
    }
  }
};

if (SHELL_MINOR > 30) {
  SMBiosIndicator = GObject.registerClass(
    { GTypeName: "SMBiosIndicator" },
    SMBiosIndicator
  );
}
var indicator = null;

function init() {
  log(`initializing ${Me.metadata.name} version ${Me.metadata.version}`);
}

function enable() {
  log(`enabling ${Me.metadata.name} version ${Me.metadata.version}`);

  indicator = new SMBiosIndicator();

  Main.panel.addToStatusArea(`${Me.metadata.name} Indicator`, indicator);
}

function disable() {
  log(`disabling ${Me.metadata.name} version ${Me.metadata.version}`);

  if (indicator !== null) {
    indicator.destroy();
    indicator = null;
  }
}