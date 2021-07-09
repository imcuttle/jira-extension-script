import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
axios.defaults.validateStatus = (s) => s < 400

export default class JiraApi {
  constructor(
    public options: {
      axios?: AxiosInstance
      baseURL?: string
      requestConfig?: AxiosRequestConfig
      user: string
      password: string
    }
  ) {
    Object.assign(
      this.options,
      {
        axios,
        requestConfig: {}
      },
      this.options
    )

    Object.assign(
      this.options.requestConfig,
      {
        validateStatus: (status) => true
      },
      this.options.requestConfig
    )

    const { requestConfig } = this.options
    Object.assign(this.axios.defaults, requestConfig)
    if (this.options.baseURL) {
      this.axios.defaults.baseURL = this.options.baseURL
    }

    this.axios.defaults.auth = {
      username: this.options.user,
      password: this.options.password
    }

    this.axios.interceptors.request.use((requestConfig) => {
      requestConfig.headers = {
        // authorization: `Basic ${base64.encode(`${this.options.user}:${this.options.password}`)}`,
        ...requestConfig.headers
      }
      return requestConfig
    })
  }

  public get axios() {
    return this.options.axios
  }

  request(config: AxiosRequestConfig) {
    return this.axios.request(config)
  }
}
