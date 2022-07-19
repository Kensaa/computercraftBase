import { useState,useEffect} from "react";

export function useSortingFetch(address,options,sortCriteria){
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(()=>{
        fetch(address,options).then(response => response.json()).then(data => {
        data = data.filter(e => e.type === sortCriteria).map(e=>e.name)
        setData(data);
        setLoading(false);
    }
    ).catch(error => {
        setError(error);
        setLoading(false);
    })},[sortCriteria,address,options]);
    return {data, loading, error};

}

export function useFetch(address,options){
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(()=>{
        fetch(address,options).then(response => response.json()).then(data => {
        setData(data);
        setLoading(false);
    }
    ).catch(error => {
        setError(error);
        setLoading(false);
    })},[address,options]);
    return {data, loading, error};

}

//sorry for the future me
export function useLocalStorage(key,defaultValue){
    const [value, setValue] = useState(localStorage.getItem(key) ?? defaultValue);
    useEffect(()=>{
        localStorage.setItem(key,value);
    },[value,key]);
    return [value, setValue];
}