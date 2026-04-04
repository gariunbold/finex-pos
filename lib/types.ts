// ── Field types ──
export type FieldType =
  | 'text' | 'number' | 'money' | 'textarea' | 'date'
  | 'combo' | 'search' | 'checkbox' | 'radio' | 'switch'
  | 'file' | 'label' | 'icon'

export interface InputConfig {
  type: FieldType
  name: string
  label: string
  opts?: {
    width?: number | string
    colSpan?: number
    labelWidth?: number
    placeholder?: string
    disabled?: boolean
    // number
    min?: number
    max?: number
    step?: number
    // textarea
    rows?: number
    // date
    defaultValue?: string
    // combo
    url?: string
    params?: Record<string, any>
    data?: Array<{ value: any; label: string }>
    dependsOn?: string
    grouped?: boolean
    // search
    controller?: string
    columns?: ColumnConfig[]
    displayField?: string
    displayFormat?: (item: any) => string
    allowCreate?: boolean
    createInputs?: InputConfig[]
    // radio
    options?: Array<{ value: any; label: string }>
    // file
    accept?: string
    multiple?: boolean
    isImage?: boolean
    // any extra
    [key: string]: any
  }
}

// ── Column ──
export interface ColumnConfig {
  id: string
  header: string
  width?: number | string
  sort?: 'string' | 'int' | 'text'
  format?: 'money' | 'count' | 'qty'
  template?: (row: any) => string
  footer?: 'sum' | 'count'
}

// ── Form layout ──
export interface FormLayout {
  columns?: number
  labelWidth?: number
  inputWidth?: string
}

// ── Permissions ──
export interface CrudPermissions {
  isCreate?: boolean
  isEdit?: boolean
  isDelete?: boolean
  isPrint?: boolean
  isSearch?: boolean
  readOnly?: boolean
}

// ── Custom button ──
export interface CustomButton {
  label: string
  icon?: string
  onClick: () => void
  tooltip?: string
  variant?: string
}

// ── Context menu item ──
export interface ContextMenuItem {
  label?: string
  icon?: string
  action?: string
  separator?: boolean
  hidden?: (item: any) => boolean
  disabled?: (item: any) => boolean
}

// ── Left action (CrudDialog footer) ──
export interface LeftAction {
  label: string
  icon?: string
  onClick: (formValues: any, mode: string) => void
  variant?: string
}

// ── Callbacks ──
export interface FormContext {
  values: Record<string, any>
  changedField?: string
  changedValue?: any
  mode: 'create' | 'edit'
  setVisible: (fieldName: string, visible: boolean) => void
  setDisabled: (fieldName: string, disabled: boolean) => void
  setValue: (fieldName: string, value: any) => void
  setOptions: (fieldName: string, options: Array<{ value: any; label: string }>) => void
  setLabel: (fieldName: string, text: string) => void
  setRequired: (fieldName: string, required: boolean) => void
  setError: (fieldName: string, message: string | null) => void
}

export interface CrudCallbacks {
  onFormInit?: (context: FormContext) => void
  onFormValuesChange?: (context: FormContext) => void
  onFormValidate?: (values: Record<string, any>, mode: string) => true | false | Record<string, string>
  onBeforeSave?: (formData: Record<string, any>, mode: string) => boolean | void | Promise<boolean | void>
  onAfterSave?: (response: any, mode: string) => void
  onBeforeDelete?: (item: any) => boolean | void | Promise<boolean | void>
  onAfterDelete?: (response: any) => void
  onDoubleClick?: (item: any) => void
  onRowSelect?: (item: any) => void
  onLoadAfter?: (data: any) => void
  onContextMenuClick?: (action: string, item: any) => void
  transformListParams?: (params: Record<string, any>) => void
  onCreateClick?: () => boolean | object | void
  onEditClick?: (item: any) => boolean | void
  onDeleteClick?: (item: any) => boolean | void
  onExcelClick?: (data: any[]) => boolean | void
}

// ── Entity config ──
export interface EntityConfig extends CrudCallbacks {
  controller: string
  title: string
  columns: ColumnConfig[]
  inputs: InputConfig[]
  filterInputs?: InputConfig[]
  defaultSort?: { field: string; order: string }
  windowWidth?: number
  formLayout?: FormLayout
  permissions?: CrudPermissions
  params?: Record<string, any>
  multiSelect?: boolean
  customButtonsLeft?: CustomButton[]
  customButtonsRight?: CustomButton[]
  leftActions?: LeftAction[]
  contextMenuItems?: ContextMenuItem[]
  customContextMenuItems?: ContextMenuItem[]
  createParams?: Record<string, any> | (() => Record<string, any>)
  saveParams?: Record<string, any> | ((formData: Record<string, any>, mode: string) => Record<string, any>)
  deleteParams?: Record<string, any> | (() => Record<string, any>)
}

// ── Theme ──
export interface ThemeConfig {
  id: string
  label: string
  primary: string
  swatch: string
}
