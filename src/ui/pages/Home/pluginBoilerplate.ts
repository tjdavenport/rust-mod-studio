export default (pluginName: string) => `namespace Oxide.Plugins
{
    [Info("${pluginName}", "<YOUR_NAME>", "0.0.1")]
    [Description("A plugin built with Rust Mod Studio")]

    class ${pluginName} : CovalencePlugin {
    }
}`;
