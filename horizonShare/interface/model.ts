interface Connect {
  id: string
  input: string
  output: string
}

export interface ModelNodeInterface {
  id: string
  pos: {
    h: number
    w: number
    x: number
    y: number
  }
  desc: string
  autoInit?: boolean
  icon: string
  type: string
  title: string
  connect: Connect[]
  interfaz: {
    inputs: string[]
    outputs: string[]
  }
  disabled?: boolean
  properties: object
}

export interface PropertiesInterface {
  name: string
  value: object
  config?: {
    logs?: any
  }
}

export interface ContextInterface {
  logger: any
  properties: PropertiesInterface
  nodes: {
    value: ModelNodeInterface
  }
}

export interface ModelInterface {
  id: string
  name: string
  version: string
  properties: object
  subFlows: string[]
  option: string
  connect: any
  data:any
  node: ModelNodeInterface
}
