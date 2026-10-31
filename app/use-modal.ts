'use client';
import {useEffect,useRef} from 'react';
export function useModal(open:boolean,close:()=>void){
 const closeRef=useRef(close);closeRef.current=close;
 useEffect(()=>{if(!open)return;const previous=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  const dialogs=document.querySelectorAll<HTMLElement>('[role="dialog"]');const dialog=dialogs[dialogs.length-1];
  const focusables=()=>dialog?Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not([type="hidden"]):not(:disabled),textarea,select,iframe,[tabindex="0"]')).filter(el=>el.getClientRects().length):[];
  focusables()[0]?.focus();
  const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();closeRef.current();}if(e.key==='Tab'){const items=focusables();const first=items[0],last=items[items.length-1];if(!first){e.preventDefault();return;}if(e.shiftKey&&(document.activeElement===first||!dialog?.contains(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!dialog?.contains(document.activeElement))){e.preventDefault();first.focus();}}};
  document.addEventListener('keydown',onKey);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',onKey);if(previous?.isConnected)previous.focus();};
 },[open]);
}
