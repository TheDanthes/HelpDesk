import { getCookie } from "cookies-next";
import moment from "moment";
import { useRouter } from "next/router";
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import TicketsMobileList from "../../components/TicketsMobileList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Button } from "@/shadcn/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";

const fetchALLTIckets = async () => {
  const res = await fetch(`/api/v1/tickets/all`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie("session")}`,
    },
  });
  return res.json();
};

function DefaultColumnFilter({ column }: any) {
  return (
    <input
      className="block w-full rounded-md border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      type="text"
      value={column.getFilterValue() || ""}
      onChange={(e) => {
        column.setFilterValue(e.target.value || undefined);
      }}
      placeholder="Type to filter"
    />
  );
}
function TicketsTable({ columns, data }: any) {
  const [columnFilters, setColumnFilters] = React.useState([]);
  const table = useReactTable({
    data,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    filterFns: {
      startsWith: (row, columnId, value) => {
        const rowValue = row.getValue(columnId);
        return rowValue !== undefined
          ? String(rowValue)
              .toLowerCase()
              .startsWith(String(value).toLowerCase())
          : true;
      },
    },
    defaultColumn: {
      filterFn: "includesString",
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  });

  return (
    <div className="overflow-x-auto md:-mx-6 lg:-mx-8">
      <div className="py-2 align-middle inline-block min-w-full md:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg border border-border/60 bg-card/80 shadow-sm">
          <Table className="min-w-full divide-y divide-border/60">
            <TableHeader className="bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const hideHeader =
                      (header.column.columnDef as { hideHeader?: boolean })
                        .hideHeader === false;
                    if (hideHeader) {
                      return null;
                    }
                    return (
                      <TableHead
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        <div>
                          {header.column.getCanFilter() ? (
                            <DefaultColumnFilter column={header.column} />
                          ) : null}
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-b border-border/60">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data.length > 10 && (
            <nav
              className="flex items-center justify-between border-t border-border/60 bg-card/70 px-4 py-3 sm:px-6"
              aria-label="Pagination"
            >
              <div className="hidden sm:block">
                <div className="flex flex-row flex-nowrap w-full space-x-2">
                  <p className="block text-sm font-medium text-muted-foreground mt-4">
                    Show
                  </p>
                  <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => {
                      table.setPageSize(Number(value));
                    }}
                  >
                    <SelectTrigger className="bg-background/60">
                      <SelectValue placeholder="Page size" />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 30, 40, 50].map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex-1 flex justify-between sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-3"
                  type="button"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Clients() {
  const { data, isLoading, isError, isSuccess, refetch } = useQuery({
    queryKey: ["fetchallTickets"],
    queryFn: fetchALLTIckets,
  });

  const router = useRouter();

  const high = "bg-red-100 text-red-800";
  const low = "bg-blue-100 text-blue-800";
  const normal = "bg-green-100 text-green-800";

  const columns = useMemo(
    () => [
      {
        header: "Type",
        accessorKey: "type",
        id: "type",
      },
      {
        header: "Summary",
        accessorKey: "title",
        id: "summary",
        cell: ({ getValue }: any) => {
          return <span className="max-w-[240px] truncate">{getValue()}</span>;
        },
      },
      {
        header: "Assignee",
        id: "assignee",
        accessorFn: (row: any) => row?.assignedTo?.name,
        cell: ({ getValue }: any) => {
          const value = getValue();
          return <span className="w-[80px] truncate">{value || "n/a"}</span>;
        },
      },
      {
        header: "Client",
        id: "client",
        accessorFn: (row: any) => row?.client?.name,
        cell: ({ getValue }: any) => {
          const value = getValue();
          return <span className="w-[80px] truncate">{value || "n/a"}</span>;
        },
      },
      {
        header: "Priority",
        accessorKey: "priority",
        id: "priority",
        cell: ({ getValue }: any) => {
          const value = getValue();
          let badge;

          if (value === "Low") {
            badge = low;
          }
          if (value === "Normal") {
            badge = normal;
          }
          if (value === "High") {
            badge = high;
          }

          return (
            <span
              className={`inline-flex items-center rounded-md justify-center w-1/2 px-2 py-1 text-xs font-medium ring-1 ring-inset ${badge}`}
            >
              {value}
            </span>
          );
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        id: "status",
        cell: ({ getValue }: any) => {
          const value = getValue();
          return (
            <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-red-600/10">
              {value === "needs_support" && <span>Needs Support</span>}
              {value === "in_progress" && <span>In Progress</span>}
              {value === "in_review" && <span>In Review</span>}
              {value === "done" && <span>Done</span>}
            </span>
          );
        },
      },
      {
        header: "Created",
        accessorKey: "createdAt",
        id: "created",
        cell: ({ getValue }: any) => {
          const now = moment(getValue()).format("DD/MM/YYYY");
          return <span className="">{now}</span>;
        },
      },
    ],
    [high, low, normal]
  );

  return (
    <main className="flex-1">
      <div className="relative max-w-4xl mx-auto md:px-8 xl:px-0">
        <div className="pt-10 pb-16 divide-y-2">
          <div className="px-4 sm:px-6 md:px-0">
            <h1 className="text-3xl font-extrabold text-gray-900">Tickets</h1>
          </div>
          <div className="px-4 sm:px-6 md:px-0">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto mt-4">
                <p className="mt-2 text-sm text-gray-700">
                  A list of all your organisation's tickets, regardless of
                  status.
                </p>
              </div>
            </div>
            <div className="py-4">
              {isLoading && (
                <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
                  <h2> Loading data ... </h2>
                </div>
              )}

              {isError && (
                <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
                  <h2 className="text-2xl font-bold">
                    {" "}
                    Error fetching data ...{" "}
                  </h2>
                </div>
              )}
              {isSuccess && (
                <>
                  {data.tickets && data.tickets.length > 0 && (
                    <>
                      <div className="hidden sm:block ">
                    <TicketsTable columns={columns} data={data.tickets} />
                      </div>

                      <div className="sm:hidden">
                        <TicketsMobileList tickets={data.tickets} />
                      </div>
                    </>
                  )}

                  {data.tickets.length === 0 && (
                    <>
                      <div className="text-center mt-72">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>

                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                          You currently don't have any assigned tickets. :)
                        </h3>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
