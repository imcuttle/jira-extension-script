import { createAppConfigContext } from '../../components/app-config-provider';
import { configContext } from '../config-context';

const { AppConfigConsumer, useAppConfig, AppConfigProvider } = createAppConfigContext(configContext);

export { AppConfigConsumer, useAppConfig, AppConfigProvider };
