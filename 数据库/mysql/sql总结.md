

#### 日期时间截取

```
selectdate_format(expenses_date,'%H:%i:%S') from t_expenses_records
```



```
select d.records_id, e.res_name, e.service_name,
       case when date_format(expenses_date,'%H:%i:%S') > '03:00:01' and date_format(expenses_date,'%H:%i:%S') < '10:00:59' then '早餐'
            when date_format(expenses_date,'%H:%i:%S') > '10:01:00' and date_format(expenses_date,'%H:%i:%S') < '16:00:59' then '午餐'
            when date_format(expenses_date,'%H:%i:%S') > '16:01:00' and date_format(expenses_date,'%H:%i:%S') < '21:00:59' then '晚餐'
            else '夜餐'
           end '餐类',
      d.food_type_name, d.food_name, d.subsidy_rate,d.expenses_number, d.food_amount, r.expenses_date from t_expenses_detailed d, temp_expense_record e, t_expenses_records r
where d.records_id = e.record_id
and e.record_id = r.id
```