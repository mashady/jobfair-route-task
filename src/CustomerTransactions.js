import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "./Modal";

const CustomerTransactions = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filterAmount, setFilterAmount] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [dailyTransactionData, setDailyTransactionData] = useState([]);

  useEffect(() => {
    // Fetch customers
    axios
      .get("https://route-json.vercel.app/customers")
      .then((response) => {
        setCustomers(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching customers:", error);
        setError(error.message);
        setLoading(false);
      });

    // Fetch transactions
    axios
      .get("https://route-json.vercel.app/transactions")
      .then((response) => setTransactions(response.data))
      .catch((error) => console.error("Error fetching transactions:", error));
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSelectedCustomer(null);
    if (name === "name") {
      setFilterCustomer(value);
    } else if (name === "amount") {
      setFilterAmount(value);
    }
  };
  const handleButtonClick = (customer) => {
    setSelectedCustomer(customer);
    const dailyData = aggregateTransactionsByDate(customer.transactions);
    setDailyTransactionData(dailyData);
  };
  const aggregateTransactionsByDate = (transactions) => {
    const groupedData = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date).toLocaleDateString(); // Assuming transaction.date is in ISO format
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += transaction.amount;
      return acc;
    }, {});

    return Object.keys(groupedData).map((date) => ({
      date,
      amount: groupedData[date],
    }));
  };
  const organizeTransactions = (customers, transactions) => {
    return customers.map((customer) => {
      const customerTransactions = transactions.filter(
        (transaction) => transaction.customer_id == customer.id
      );
      const totalAmount = customerTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );
      return {
        ...customer,
        transactions: customerTransactions,
        totalAmount,
      };
    });
  };

  const filteredCustomers = (organizedData) => {
    return organizedData.filter(
      (customer) =>
        (filterAmount === "" ||
          customer.totalAmount == parseFloat(filterAmount)) &&
        (filterCustomer === "" ||
          customer.name.toLowerCase().includes(filterCustomer.toLowerCase()))
    );
  };
  const organizedData = organizeTransactions(customers, transactions);
  const filteredData = filteredCustomers(organizedData);

  return (
    <div className="w-[80%] mx-auto relative">
      <h1 className="text-2xl font-semibold my-4">Customer Transactions</h1>
      <div className="flex justify-between items-center flex-wrap">
        <div>
          <label className="text-lg">
            Filter by customer name:
            <input
              type="text"
              value={filterCustomer}
              name="name"
              onChange={handleFilterChange}
              placeholder="Enter Customer Name"
              className="rounded-md ml-4 border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none  disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
        </div>
        <div className="">
          <label className="text-lg">
            Filter by amount:
            <input
              type="text"
              value={filterAmount}
              name="amount"
              onChange={handleFilterChange}
              placeholder="Enter amount"
              className="rounded-md ml-4 border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none  disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
        </div>
        <button
          className="bg-gray-900 text-white h-[50px] px-4 rounded"
          onClick={() => {
            setFilterAmount("");
            setFilterCustomer("");
          }}
        >
          Clear filters
        </button>
      </div>
      {filteredData.length === 0 && (
        <div className="my-4">there no transaction with this total amount </div>
      )}
      <div className="relative  rounded py-12">
        <table className="w-full  rounded text-sm text-left text-gray-500 border-[2px] border-gray-50">
          <thead className="text-xs  text-gray-700 uppercase bg-gray-50">
            <tr className="">
              <th scope="col" class="px-6 py-3">
                Customer Name
              </th>
              <th scope="col" class="px-6 py-3">
                Transactions
              </th>
              <th scope="col" class="px-6 py-3">
                Total Amount
              </th>
              <th scope="col" class="px-6 py-3">
                Graph
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((customer) => (
              <tr key={customer.id} className="bg-white border-b">
                <th
                  scope="row"
                  class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                >
                  {customer.name}
                </th>
                <td class="px-6 py-4">
                  <ul>
                    {customer.transactions.map((transaction) => (
                      <li key={transaction.id}>
                        <div className="rounded text-gray-700 bg-gray-50 px-6 py-2 my-2">
                          <div>Amount: ${transaction.amount}</div>
                          <div>Date: {transaction.date}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </td>
                <td class="px-6 py-4">{`Total amount is $${customer.totalAmount}
              `}</td>
                <td class="px-6 py-4">
                  <Modal
                    selectedCustomer={selectedCustomer}
                    dailyTransactionData={dailyTransactionData}
                    handleButtonClick={handleButtonClick}
                    customer={customer}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/** error handler and loading */}
      {(loading || error) && (
        <div className="rounded fixed bg-white top-0 left-0 w-full h-screen flex justify-center items-center">
          <div className="flex flex-col justify-center items-center">
            {loading && (
              <div className="w-[100px] h-[100px] mb-6 rounded shadow bg-gray-100 flex justify-center items-center">
                <span>loading...</span>
                <div></div>
              </div>
            )}
            {error && (
              <div className="rounded shadow bg-red-700 p-4 text-white">
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerTransactions;
