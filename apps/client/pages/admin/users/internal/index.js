import { getCookie } from "cookies-next";
import Link from "next/link";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import ResetPassword from "../../../../components//ResetPassword";
import UpdateUserModal from "../../../../components/UpdateUserModal";
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

const fetchUsers = async (token) => {
  const res = await fetch(`/api/v1/users/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  return res.json();
};

function DefaultColumnFilter({ column }) {
  return (
    // <input
    //   className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
    //   type="text"
    //   value={filterValue || ""}
    //   autoComplete="off"
    //   onChange={(e) => {
    //     setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
    //   }}
    //   placeholder="Type to filter"
    // />
    <></>
  );
}
function UsersTable({ columns, data }) {
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

          {data.legnth > 10 && (
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
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserAuthPanel() {
  const token = getCookie("session");
  const { data, isLoading, isError, isSuccess, refetch } = useQuery({
    queryKey: ["fetchAuthUsers"],
    queryFn: () => fetchUsers(token),
  });

  async function deleteUser(id) {
    try {
      await fetch(`/api/v1/auth/user/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then(() => {
          refetch();
        });
    } catch (error) {
      console.log(error);
    }
  }

  const columns = React.useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "name",
        id: "name",
      },
      {
        header: "Email",
        accessorKey: "email",
        id: "email",
      },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => {
          return (
            <div className="space-x-4 flex flex-row">
              <UpdateUserModal user={row.original} />
              <ResetPassword user={row.original} />
              {row.original.isAdmin ? null : (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteUser(row.original.id)}
                >
                  Delete
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [deleteUser]
  );

  return (
    <main className="flex-1">
      <div className="relative max-w-4xl mx-auto md:px-8 xl:px-0">
        <div className="pt-10 pb-16 divide-y-2">
          <div className="px-4 sm:px-6 md:px-0">
            <h1 className="text-3xl font-extrabold text-foreground">
              Internal Users
            </h1>
          </div>
          <div className="px-4 sm:px-6 md:px-0">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto mt-4">
                <p className="mt-2 text-sm text-muted-foreground">
                  A list of all internal users of your instance.
                </p>
              </div>
              <div className="sm:ml-16 mt-5 sm:flex-none">
                <Button asChild>
                  <Link href="/admin/users/internal/new">New User</Link>
                </Button>
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
                <div>
                  <div className="hidden sm:block">
                    <UsersTable columns={columns} data={data.users} />
                  </div>
                  <div className="sm:hidden">
                    {data.users.map((user) => (
                      <div
                        key={user.id}
                        className="flex flex-col text-center rounded-lg border border-border/60 bg-card/80 shadow mt-4"
                      >
                        <div className="flex-1 flex flex-col p-8">
                          <h3 className="text-foreground text-sm font-medium">
                            {user.name}
                          </h3>
                          <dl className="mt-1 flex-grow flex flex-col justify-between">
                            <dd className="text-muted-foreground text-sm">
                              {user.email}
                            </dd>
                            <dt className="sr-only">Role</dt>
                            <dd className="mt-3">
                              <span className="px-2 py-1 text-green-800 text-xs font-medium bg-green-100 rounded-full">
                                {user.isAdmin ? "admin" : "user"}
                              </span>
                            </dd>
                          </dl>
                        </div>
                        <div className="space-x-4 flex flex-row justify-center -mt-8 mb-4">
                          <UpdateUserModal
                            user={user}
                            refetch={() => handleRefresh}
                          />
                          <ResetPassword user={user} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
