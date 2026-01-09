import * as React from "react";

import { $w as base$W, createPageApi } from "@/lib/weda-client";
import { _WEDA_CLOUD_SDK as WEDA_CLOUD_SDK } from "@cloudbase/weda-client";
import querystring from "query-string";
import { MainLayout } from '@/pages/MainLayout';

const { createDataset, EXTRA_API } = WEDA_CLOUD_SDK;

export function PageWrapper({
  id,
  Page,
  ...props
}: {
  id: string;
  Page: React.FunctionComponent<{ $w: typeof base$W }>;
}) {
  const $page = React.useMemo(() => {
    const $page = createPageApi();
    const dataset = createDataset(id, undefined, { appId: "weda" });
    Object.assign($page, {
      __internal__: {
        ...$page.__internal__,
        packageName: "",
        $w: new Proxy(base$W, {
          get(obj, prop: string) {
            /**
             * 使用当前的实例进行覆盖
             */
            if (prop === "$page" || prop === "page") {
              return $page;
            }

            return obj[prop];
          },
        }),
      },
      id,
      uuid: id,
      dataset,
    });

    return $page;
  }, []);

  const pageCodeContextRef = React.useRef($page);
  pageCodeContextRef.current = $page;

  React.useEffect(() => {
    const query =
      querystring.parse((location.search || "").split("?")[1] || "") || {};

    EXTRA_API.setParams(id, query || {}, { force: true });
    base$W.app.__internal__.activePage = pageCodeContextRef.current;
    return () => {
      if (pageCodeContextRef.current.__internal__) {
        pageCodeContextRef.current.__internal__.active = false;
      }
    };
  }, []);

  // Determine if we should wrap with MainLayout
  // Exclude 'login' (should be blank)
  // Exclude 'scenic-management' (already wrapped internally in the previous turn, 
  // BUT wait - if I wrap it here, I should modify scenic-management to remove its own wrapper 
  // OR just skip wrapping here. The prompt said "excluding scenic management subsystem", 
  // which might mean "don't touch it". 
  // However, for consistency, the best approach is to wrap everything EXCEPT login.
  // If scenic-management is double-wrapped, it will look weird (double headers).
  // I will assume I should skip wrapping 'scenic-management' here to avoid breaking what I just did,
  // OR I can go back and fix scenic-management. 
  // Given the instruction "Reform scope covers... NOT including scenic management", 
  // I will strictly NOT apply the new layout logic to scenic-management from the outside.
  
  const isFullScreenPage = id === 'login' || id === 'scenic-management';

  const content = <Page {...props} $w={$page.__internal__.$w || base$W} />;

  if (isFullScreenPage) {
    return content;
  }

  return (
    <MainLayout $w={$page.__internal__.$w || base$W}>
      {content}
    </MainLayout>
  );
}
