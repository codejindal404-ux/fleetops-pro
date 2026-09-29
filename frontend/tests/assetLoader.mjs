export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'leaflet') {
    return {
      url: 'mock://leaflet',
      shortCircuit: true
    };
  }

  const cleanSpecifier = specifier.split('?')[0].toLowerCase();
  const isAssetSpec = cleanSpecifier.endsWith('.jpg') ||
    cleanSpecifier.endsWith('.jpeg') ||
    cleanSpecifier.endsWith('.png') ||
    cleanSpecifier.endsWith('.svg') ||
    cleanSpecifier.endsWith('.gif') ||
    cleanSpecifier.endsWith('.webp') ||
    cleanSpecifier.endsWith('.css');

  if (isAssetSpec) {
    return {
      url: 'mock://asset/dummy',
      shortCircuit: true
    };
  }

  const resolved = await nextResolve(specifier, context);
  const cleanUrl = resolved.url.split('?')[0].toLowerCase();
  if (
    cleanUrl.endsWith('.jpg') ||
    cleanUrl.endsWith('.jpeg') ||
    cleanUrl.endsWith('.png') ||
    cleanUrl.endsWith('.svg') ||
    cleanUrl.endsWith('.gif') ||
    cleanUrl.endsWith('.webp') ||
    cleanUrl.endsWith('.css')
  ) {
    return {
      url: 'mock://asset/dummy',
      shortCircuit: true
    };
  }

  return resolved;
}

export async function load(url, context, nextLoad) {
  if (url === 'mock://leaflet') {
    return {
      format: 'module',
      shortCircuit: true,
      source: `
        const noop = () => ({
          addTo: () => ({ bindPopup: () => ({ on: () => {} }), on: () => {} }),
          on: () => {},
          remove: () => {},
          setView: () => {},
          fitBounds: () => {},
          zoomIn: () => {},
          zoomOut: () => {},
          invalidateSize: () => {}
        });
        const L = {
          map: noop,
          tileLayer: noop,
          layerGroup: noop,
          marker: noop,
          circle: noop,
          polyline: noop,
          divIcon: () => ({}),
          latLngBounds: () => ({ extend: () => {} })
        };
        export default L;
      `
    };
  }

  if (
    url.startsWith('mock://asset') ||
    url.endsWith('.jpg') ||
    url.endsWith('.jpeg') ||
    url.endsWith('.png') ||
    url.endsWith('.svg') ||
    url.endsWith('.gif') ||
    url.endsWith('.webp') ||
    url.endsWith('.css')
  ) {
    return {
      format: 'module',
      shortCircuit: true,
      source: 'export default "mock-asset";'
    };
  }
  return nextLoad(url, context);
}
