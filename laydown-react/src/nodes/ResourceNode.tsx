import { useEffect, useState } from 'react';


export type ResourceStoreProps = {
  link: string,
  descriptor?: string,
  lang?: string,
  type?: 'static' | 'http' | 'both',
  getter?: StaticResourceGetter,
};

export type ResourceMeta = {
  lang: string,
  type?: string,
  format: string,
  time: number,
}

export type ResourceStore = [string | undefined, Response | undefined, ResourceMeta | undefined];

export type StaticResourceGetter = (path: string, descriptor?: string, currentLang?: string, timeRefresh?: number)
=> Promise<[undefined, Response, ResourceMeta] | [string, undefined, ResourceMeta]>

export const useResourceStore = (props: ResourceStoreProps): ResourceStore => {
  
  const [resource, setResource] = useState<string | undefined>(undefined);
  const [error, setError] = useState<Response | undefined>(undefined);
  const [meta, setMeta] = useState<ResourceMeta | undefined>(undefined);

  const { link, descriptor, lang, type: getResource } = props;

  const getResHttp = async () => {
    let ret = false;
    const response = await fetch(link);
    if (response.ok) {
      setResource(await response.text());
      setError(undefined);
      ret = true;
    } else {
      setResource(undefined);
      setError(response);
    }
    setMeta(undefined);
    return ret;
  };

  const getResStatic = async () => {
    let ret = false;
    const [data, err, meta] = await props.getter?.(link, descriptor, lang) ?? [undefined, undefined, {
      lang: '', 
      time: 0, 
      format: '',
    } as ResourceMeta];
    if (err) {
      setError(err);
      setResource(undefined);
    } else {
      setResource(data);
      setError(undefined);
      ret = true;
    }
    setMeta(meta);
    return ret;
  };

  useEffect(() => {
    const f = ( getResource === undefined || getResource === 'both' ) ? 
      async () => {
        const retStatic = getResStatic();
        if (!retStatic)
          getResHttp();
      } : 
      getResource === 'static' ? 
        getResStatic : 
        getResHttp;
    f().catch((err => setResource(err)));
  }, [link, descriptor, lang, getResource]);

  return [resource, error, meta];
};