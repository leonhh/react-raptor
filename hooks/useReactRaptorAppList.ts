import { useQuery } from "@tanstack/react-query";
import {
  AndroidAppListPackage,
  ExpoAndroidAppList,
} from "expo-android-app-list";
import { ExpoConfig } from "@expo/config-types";

const reactNativeLibraries = [
  "libreactnativejni.so",
  "libreactnative.so",
  "libjsijniprofiler.so",
];

export type ReactRaptorApp = AndroidAppListPackage & {
  icon: string;
  nativeLibraries: string[];
  expoConfig?: ExpoConfig;
  permissions: string[];
};

export const useReactRaptorAppList = () => {
  const query = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const combinedResults: ReactRaptorApp[] = [];

      const result = await ExpoAndroidAppList.getAll();

      for (const pkg of result) {
        if (pkg.isSystemApp) {
          continue;
        }

        const nativeLibraries = await ExpoAndroidAppList.getNativeLibraries(
          pkg.packageName
        );

        if (nativeLibraries.some((lib) => reactNativeLibraries.includes(lib))) {
          const [filesResult, iconResult, permissionsResult] = await Promise.allSettled([
            ExpoAndroidAppList.getFiles(pkg.packageName, ["assets/app.config"]),
            ExpoAndroidAppList.getAppIcon(pkg.packageName),
            ExpoAndroidAppList.getPermissions(pkg.packageName),
          ]);

          const files = filesResult.status === 'fulfilled' ? filesResult.value : undefined;
          const icon = iconResult.status === 'fulfilled' ? iconResult.value : '';
          const permissions = permissionsResult.status === 'fulfilled' ? permissionsResult.value : [];

          const config = files?.[0]?.content;

          combinedResults.push({
            ...pkg,
            icon,
            expoConfig: config ? (JSON.parse(config) as ExpoConfig) : undefined,
            nativeLibraries,
            permissions,
          });
        }
      }

      return combinedResults;
    },
  });

  return query;
};
