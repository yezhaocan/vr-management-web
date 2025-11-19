// @ts-ignore;
import React from 'react';

// @ts-ignore;
import { RouteEditor } from './RouteEditor';
export function RouteCreation(props) {
  const {
    onClose,
    onSuccess,
    $w
  } = props;
  return <RouteEditor onClose={onClose} onSuccess={onSuccess} $w={$w} />;
}