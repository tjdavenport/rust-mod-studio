function toPascalCase(input: string): string {
    const words = input.split(/[-_\s]+/);
    const pascalCaseWords = words.map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
    return pascalCaseWords.join('');
}

export default (pluginName: string) => `namespace Oxide.Plugins
{
    [Info("${pluginName}", "<YOUR_NAME>", "0.0.1")]
    [Description("A plugin built with Rust Mod Studio")]

    class ${toPascalCase(pluginName)} : CovalencePlugin {
    }
}`;
