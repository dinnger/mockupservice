export function gitPromiseParameters (git, parameters, data) {
  if (git.parameters) {
    git.parameters.forEach(item => {
      parameters[`{{${item.key}}}`] = item.value
    })
  }
  if (data.deployParameters) {
    data.deployParameters.forEach(item => {
      parameters[`{{${item.key}}}`] = item.value
    })
  }
}
