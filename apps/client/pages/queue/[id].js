import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import Loader from "react-spinners/ClipLoader";
import { useRouter } from "next/router";
import { Input } from "@/shadcn/ui/input";
import { Button } from "@/shadcn/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";

// import MarkdownPreview from "../MarkdownPreview";
import TicketsMobileList from "../../components/TicketsMobileList";

function DefaultColumnFilter({ column }) {
  return (
    <Input
      className="bg-background/60"
      type="text"
      value={column.getFilterValue() || ""}
      onChange={(e) => {
        column.setFilterValue(e.target.value || undefined);
      }}
      placeholder="Type to filter"
    />
  );
}

function QueueTable({ columns, data }) {
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
                    const hideHeader = header.column.columnDef?.hideHeader === false;
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

          <nav
            className="flex items-center justify-between border-t border-border/60 bg-card/70 px-4 py-3 sm:px-6"
            aria-label="Pagination"
          >
            <div className="hidden sm:block">
              <div className="flex flex-row flex-nowrap w-full space-x-2">
                <p
                  htmlFor="location"
                  className="block text-sm font-medium text-muted-foreground mt-4"
                >
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
        </div>
      </div>
    </div>
  );
}

export default function AssignedTickets() {
  const router = useRouter();
  async function getUserTickets() {
    const res = await fetch(
      `/api/v1/ticket/emailQueue?name=${router.query.id}`
    );
    return res.json();
  }

  const { data, isSuccess } = useQuery({
    queryKey: ["userTickets"],
    queryFn: getUserTickets,
  });

  const high = "bg-red-100 text-red-800";
  const low = "bg-blue-100 text-blue-800";
  const normal = "bg-green-100 text-green-800";

  const columns = React.useMemo(() => [
    {
      header: "No.",
      accessorKey: "Number",
      id: "number",
    },
    {
      header: "Name",
      accessorKey: "name",
      id: "name",
    },
    {
      header: "Client",
      id: "client_name",
      accessorFn: (row) => row?.client?.name,
    },
    {
      header: "Priority",
      accessorKey: "priority",
      id: "priority",
      cell: ({ getValue }) => {
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
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge}`}
          >
            {value}
          </span>
        );
      },
    },
    {
      header: "Title",
      accessorKey: "title",
      id: "Title",
      cell: ({ getValue }) => {
        return <div className="truncate">{getValue()}</div>;
      },
    },
    {
      header: "",
      id: "actions",
      cell: ({ row }) => {
        return <Link href={`/tickets/${row.original.id}`}>View</Link>;
      },
    },
  ]);

  return (
    <>
      {isSuccess && (
        <>
          {data.tickets && (
            <>
              <div className="hidden sm:block">
                <QueueTable columns={columns} data={data.tickets} />
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
    </>
  );
}
