function mySettings(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">BG Settings</Text>}>
        <TextInput
          label="Api endpoint"
          settingsKey="endpoint"
        />
        <TextInput
          label="High threshold"
          settingsKey="highThreshold"
        />
        <TextInput
        label="Low threshold"
        settingsKey="lowThreshold"
        />
        <Select
          label={`Glucose Units`}
          settingsKey="units"
          options={[
            {name:"mgdl"},
            {name:"mmol"}
          ]}
        />
        <Toggle
            settingsKey="disableAlert"
            label="Disable Alerts"
          />
      </Section>
      <Section
        title={<Text bold align="center">Clock Color</Text>}>
        <ColorSelect
          settingsKey="clockColor"
          colors={[
            {color: "#e4fa3c" /*fb-yellow*/ },
            {color: "#13d3f5" /*"fb-ycan"*/},
            {color: "#d828b8" /*"fb-violet"*/},
            {color: "#7898f8" /*"fb-cerulean"*/},
            {color: "#ffffff" /*white"*/}
          ]}
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(mySettings);