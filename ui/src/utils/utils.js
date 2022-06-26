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