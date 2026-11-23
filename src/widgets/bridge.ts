import { requireOptionalNativeModule } from 'expo';
import type { WidgetPayload } from './payload';

type DayliWidgetModule = { setData(json: string): Promise<void> | void };

/**
 * The native widget module, once a build includes it. In Expo Go it is missing and publishing does
 * nothing, so the app runs the same everywhere.
 */
const native = requireOptionalNativeModule<DayliWidgetModule>('DayliWidget');

export const widgetsAvailable = native != null;

export async function publishWidgets(payload: WidgetPayload): Promise<void> {
  if (!native) return;
  await native.setData(JSON.stringify(payload));
}
